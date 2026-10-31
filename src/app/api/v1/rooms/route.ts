import { z } from "zod";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import {
  withErrorHandling,
  ok,
  requireApiUser,
  requireApiHomeAccess,
  ApiError
} from "@/lib/api-helpers";
import { assertCanCreateRoom } from "@/lib/server/quota";
import { ROOM_TYPES } from "@/lib/types/constants";

const createRoomSchema = z.object({
  homeId: z.string().uuid(),
  name: z.string().trim().min(1).max(120),
  roomType: z.enum(ROOM_TYPES).optional(),
  floor: z.number().int().optional(),
  width: z.number().positive().max(100).optional(),
  length: z.number().positive().max(100).optional(),
  height: z.number().positive().max(20).optional(),
  position: z.record(z.string(), z.number()).optional().nullable()
});

export const GET = withErrorHandling(async (request) => {
  await requireApiUser();
  const url = new URL(request.url);
  const homeId = url.searchParams.get("homeId");
  if (!homeId) throw new ApiError(400, "Missing homeId query parameter.", "missing_param");

  await requireApiHomeAccess(homeId);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("rooms")
    .select("*")
    .eq("home_id", homeId)
    .is("archived_at", null)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return ok({ rooms: data ?? [] });
});

export const POST = withErrorHandling(async (request) => {
  const user = await requireApiUser();
  const body = createRoomSchema.parse(await request.json());

  await requireApiHomeAccess(body.homeId);
  await assertCanCreateRoom(user.id);

  const admin = await createAdminClient();
  const { data: room, error } = await admin
    .from("rooms")
    .insert({
      home_id: body.homeId,
      name: body.name,
      room_type: (body.roomType ?? "other") as never,
      floor: body.floor ?? 0,
      width: body.width ?? 4,
      length: body.length ?? 5,
      height: body.height ?? 2.7,
      position: body.position ?? null
    })
    .select()
    .single();
  if (error) throw error;

  await admin.from("activity_events").insert({
    home_id: body.homeId,
    actor_id: user.id,
    type: "room_created",
    payload: { room_id: room.id, name: room.name }
  });

  return ok({ room }, { status: 201 });
});
