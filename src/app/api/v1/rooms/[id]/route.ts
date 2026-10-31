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
import { ROOM_TYPES } from "@/lib/types/constants";

const updateRoomSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  roomType: z.enum(ROOM_TYPES).optional(),
  floor: z.number().int().optional(),
  width: z.number().positive().max(100).optional(),
  length: z.number().positive().max(100).optional(),
  height: z.number().positive().max(20).optional(),
  position: z.record(z.string(), z.number()).optional().nullable()
});

export const PATCH = withErrorHandling(async (request, ctx) => {
  const user = await requireApiUser();
  const roomId = parseIdParam((await ctx.params).id, "id");

  const supabase = await createClient();
  const { data: room } = await supabase.from("rooms").select("id, home_id").eq("id", roomId).maybeSingle();
  if (!room) throw new ApiError(404, "Room not found.", "not_found");

  const access = await requireApiHomeAccess(room.home_id);
  if (access.role === "viewer") {
    throw new ApiError(403, "Viewers cannot edit rooms.", "forbidden");
  }

  const body = updateRoomSchema.parse(await request.json());
  const admin = await createAdminClient();

  const patch: Record<string, unknown> = {};
  if (body.name !== undefined) patch.name = body.name;
  if (body.roomType !== undefined) patch.room_type = body.roomType;
  if (body.floor !== undefined) patch.floor = body.floor;
  if (body.width !== undefined) patch.width = body.width;
  if (body.length !== undefined) patch.length = body.length;
  if (body.height !== undefined) patch.height = body.height;
  if (body.position !== undefined) patch.position = body.position;

  const { data: updated, error } = await admin
    .from("rooms")
    .update(patch)
    .eq("id", roomId)
    .select()
    .single();
  if (error) throw error;

  await admin.from("activity_events").insert({
    home_id: room.home_id,
    actor_id: user.id,
    type: "room_created",
    payload: { room_id: room.id, edited: true }
  });

  return ok({ room: updated });
});
