import { z } from "zod";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import {
  withErrorHandling,
  ok,
  requireApiUser,
  requireApiHomeAccess,
  parseIdParam,
  ApiError
} from "@/lib/api-helpers";
import { OBJECT_CATEGORIES } from "@/lib/types/constants";

const updateObjectSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  category: z.enum(OBJECT_CATEGORIES).optional(),
  description: z.string().max(2000).optional().nullable(),
  brand: z.string().max(200).optional().nullable(),
  model: z.string().max(200).optional().nullable(),
  serialNumber: z.string().max(200).optional().nullable(),
  condition: z.string().max(500).optional().nullable(),
  valueCents: z.number().int().min(0).optional().nullable(),
  roomId: z.string().uuid().optional().nullable()
});

export const GET = withErrorHandling(async (_request, ctx) => {
  await requireApiUser();
  const objectId = parseIdParam((await ctx.params).id, "id");

  const supabase = await createClient();
  const { data: object, error } = await supabase
    .from("objects")
    .select(
      `id, home_id, name, category, description, brand, model, serial_number, condition, value_cents, thumbnail_url, image_storage_path, created_by, source_scan_id, ai_extracted, is_demo, created_at, updated_at, archived_at,
       room:rooms(id, name),
       location:object_locations!object_locations_object_id_fkey(id, room_id, container_object_id, position, observed_at, confidence, verification_status, source, is_current)`
    )
    .eq("id", objectId)
    .eq("location.is_current", true)
    .maybeSingle();

  if (error) throw error;
  if (!object) throw new ApiError(404, "Object not found.", "not_found");

  const { data: observations } = await supabase
    .from("object_observations")
    .select("id, room_id, position, observed_at, confidence, source, verification_status, scan_id, container_object_id")
    .eq("object_id", objectId)
    .order("observed_at", { ascending: false })
    .limit(20);

  const { data: documents } = await supabase
    .from("object_documents")
    .select("id, kind, filename, mime_type, size_bytes, created_at")
    .eq("object_id", objectId)
    .order("created_at", { ascending: false });

  return ok({ object, observations: observations ?? [], documents: documents ?? [] });
});

export const PATCH = withErrorHandling(async (request, ctx) => {
  const user = await requireApiUser();
  const objectId = parseIdParam((await ctx.params).id, "id");

  const supabase = await createClient();
  const { data: existing } = await supabase.from("objects").select("id, home_id, room_id").eq("id", objectId).maybeSingle();
  if (!existing) throw new ApiError(404, "Object not found.", "not_found");
  await requireApiHomeAccess(existing.home_id);

  const body = updateObjectSchema.parse(await request.json());
  const admin = await createAdminClient();

  const patch: Record<string, unknown> = {};
  if (body.name !== undefined) patch.name = body.name;
  if (body.category !== undefined) patch.category = body.category;
  if (body.description !== undefined) patch.description = body.description;
  if (body.brand !== undefined) patch.brand = body.brand;
  if (body.model !== undefined) patch.model = body.model;
  if (body.serialNumber !== undefined) patch.serial_number = body.serialNumber;
  if (body.condition !== undefined) patch.condition = body.condition;
  if (body.valueCents !== undefined) patch.value_cents = body.valueCents;

  const roomChanged = body.roomId !== undefined && body.roomId !== existing.room_id;
  if (roomChanged) patch.room_id = body.roomId;

  const { data: updated, error } = await admin
    .from("objects")
    .update(patch)
    .eq("id", objectId)
    .select()
    .single();
  if (error) throw error;

  if (roomChanged) {
    // New corrected observation + move the current location.
    await admin.from("object_observations").insert({
      object_id: objectId,
      room_id: body.roomId ?? null,
      source: "user_correction",
      confidence: 1,
      verification_status: "corrected"
    } as never);
    await admin.from("object_locations").update({ is_current: false }).eq("object_id", objectId).eq("is_current", true);
    await admin.from("object_locations").insert({
      object_id: objectId,
      home_id: existing.home_id,
      room_id: body.roomId ?? null,
      source: "user_correction",
      confidence: 1,
      verification_status: "corrected",
      is_current: true
    } as never);
    await admin.from("activity_events").insert({
      home_id: existing.home_id,
      actor_id: user.id,
      type: "object_location_changed",
      payload: { object_id: objectId, room_id: body.roomId }
    });
  } else {
    await admin.from("activity_events").insert({
      home_id: existing.home_id,
      actor_id: user.id,
      type: "object_updated",
      payload: { object_id: objectId }
    });
  }

  return ok({ object: updated });
});

export const DELETE = withErrorHandling(async (_request, ctx) => {
  const user = await requireApiUser();
  const objectId = parseIdParam((await ctx.params).id, "id");

  const supabase = await createClient();
  const { data: existing } = await supabase.from("objects").select("id, home_id").eq("id", objectId).maybeSingle();
  if (!existing) throw new ApiError(404, "Object not found.", "not_found");
  await requireApiHomeAccess(existing.home_id);

  const admin = await createAdminClient();
  await admin.from("objects").update({ archived_at: new Date().toISOString() }).eq("id", objectId);
  await admin.from("activity_events").insert({
    home_id: existing.home_id,
    actor_id: user.id,
    type: "object_updated",
    payload: { object_id: objectId, archived: true }
  });

  return ok({ deleted: true });
});
