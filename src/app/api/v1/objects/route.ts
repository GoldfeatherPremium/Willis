import { z } from "zod";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import {
  withErrorHandling,
  ok,
  requireApiUser,
  requireApiHomeAccess,
  ApiError
} from "@/lib/api-helpers";
import { OBJECT_CATEGORIES } from "@/lib/types/constants";

const createObjectSchema = z.object({
  homeId: z.string().uuid(),
  roomId: z.string().uuid().optional().nullable(),
  name: z.string().trim().min(1).max(200),
  category: z.enum(OBJECT_CATEGORIES).optional(),
  description: z.string().max(2000).optional().nullable(),
  brand: z.string().max(200).optional().nullable(),
  model: z.string().max(200).optional().nullable(),
  serialNumber: z.string().max(200).optional().nullable(),
  valueCents: z.number().int().min(0).optional().nullable()
});

export const GET = withErrorHandling(async (request) => {
  await requireApiUser();
  const url = new URL(request.url);
  const homeId = url.searchParams.get("homeId");
  if (!homeId) throw new ApiError(400, "Missing homeId query parameter.", "missing_param");
  await requireApiHomeAccess(homeId);

  const supabase = await createClient();
  let q = supabase
    .from("objects")
    .select(
      `id, name, category, description, brand, model, serial_number, value_cents, thumbnail_url, created_at, updated_at, ai_extracted, is_demo, source_scan_id,
       room:rooms(id, name),
       location:object_locations!object_locations_object_id_fkey(id, room_id, container_object_id, observed_at, confidence, verification_status, source)`
    )
    .eq("home_id", homeId)
    .is("archived_at", null)
    .eq("location.is_current", true)
    .order("created_at", { ascending: false });

  const roomId = url.searchParams.get("roomId");
  if (roomId) q = q.eq("room_id", roomId);
  const category = url.searchParams.get("category");
  if (category) q = q.eq("category", category);
  const search = url.searchParams.get("q");
  if (search) {
    const term = `%${search.toLowerCase()}%`;
    q = q.or(`name.ilike.${term},description.ilike.${term},brand.ilike.${term},model.ilike.${term},serial_number.ilike.${term}`);
  }

  const { data, error } = await q.limit(200);
  if (error) throw error;
  return ok({ objects: data ?? [] });
});

export const POST = withErrorHandling(async (request) => {
  const user = await requireApiUser();
  const body = createObjectSchema.parse(await request.json());
  await requireApiHomeAccess(body.homeId);

  const admin = await createAdminClient();
  const { data: obj, error } = await admin
    .from("objects")
    .insert({
      home_id: body.homeId,
      room_id: body.roomId ?? null,
      name: body.name,
      category: (body.category ?? "other") as never,
      description: body.description ?? null,
      brand: body.brand ?? null,
      model: body.model ?? null,
      serial_number: body.serialNumber ?? null,
      value_cents: body.valueCents ?? null,
      created_by: user.id
    })
    .select()
    .single();
  if (error) throw error;

  await admin.from("object_locations").insert({
    object_id: obj.id,
    home_id: body.homeId,
    room_id: body.roomId ?? null,
    source: "manual",
    confidence: 1,
    verification_status: "confirmed",
    is_current: true
  } as never);
  await admin.from("object_observations").insert({
    object_id: obj.id,
    room_id: body.roomId ?? null,
    source: "manual",
    confidence: 1,
    verification_status: "confirmed"
  } as never);
  await admin.from("activity_events").insert({
    home_id: body.homeId,
    actor_id: user.id,
    type: "object_created",
    payload: { object_id: obj.id, name: obj.name }
  });

  return ok({ object: obj }, { status: 201 });
});
