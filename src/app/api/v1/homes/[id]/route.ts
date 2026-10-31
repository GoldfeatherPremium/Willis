import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";
import {
  withErrorHandling,
  ok,
  requireApiUser,
  requireApiHomeAccess,
  parseIdParam,
  ApiError
} from "@/lib/api-helpers";
import { HOME_TYPES } from "@/lib/types/constants";

const updateHomeSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  homeType: z.enum(HOME_TYPES).optional(),
  address: z.string().trim().max(240).optional().nullable()
});

export const PATCH = withErrorHandling(async (request, ctx) => {
  const user = await requireApiUser();
  const homeId = parseIdParam((await ctx.params).id, "id");

  const access = await requireApiHomeAccess(homeId);
  if (access.role === "viewer" || access.role === "member") {
    throw new ApiError(403, "Only owners and admins can edit a home.", "forbidden");
  }

  const body = updateHomeSchema.parse(await request.json());
  const admin = await createAdminClient();

  const patch: Record<string, unknown> = {};
  if (body.name !== undefined) patch.name = body.name;
  if (body.homeType !== undefined) patch.home_type = body.homeType;
  if (body.address !== undefined) patch.address = body.address;

  const { data: home, error } = await admin
    .from("homes")
    .update(patch)
    .eq("id", homeId)
    .select()
    .single();
  if (error) throw error;

  await admin.from("activity_events").insert({
    home_id: homeId,
    actor_id: user.id,
    type: "home_created",
    payload: { edited: true }
  });

  return ok({ home });
});

export const DELETE = withErrorHandling(async (_request, ctx) => {
  const user = await requireApiUser();
  const homeId = parseIdParam((await ctx.params).id, "id");

  const access = await requireApiHomeAccess(homeId);
  if (access.role !== "owner") {
    throw new ApiError(403, "Only the owner can delete a home.", "forbidden");
  }

  const admin = await createAdminClient();
  const { error } = await admin
    .from("homes")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", homeId);
  if (error) throw error;

  await admin.from("activity_events").insert({
    home_id: homeId,
    actor_id: user.id,
    type: "home_created",
    payload: { archived: true }
  });

  return ok({ deleted: true });
});
