import { z } from "zod";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import {
  withErrorHandling,
  ok,
  requireApiUser,
  requireApiHomeAccess,
  ApiError
} from "@/lib/api-helpers";
import { assertCanStartScan } from "@/lib/server/quota";
import { SCAN_CAPTURE_TYPES } from "@/lib/types/constants";
import { getReconstructionProvider } from "@/lib/reconstruction";

const createScanSchema = z.object({
  roomId: z.string().uuid(),
  captureType: z.enum(SCAN_CAPTURE_TYPES).optional()
});

export const POST = withErrorHandling(async (request) => {
  const user = await requireApiUser();
  const body = createScanSchema.parse(await request.json());

  const supabase = await createClient();
  const { data: room } = await supabase.from("rooms").select("id, home_id").eq("id", body.roomId).maybeSingle();
  if (!room) throw new ApiError(404, "Room not found.", "not_found");

  await requireApiHomeAccess(room.home_id);
  await assertCanStartScan(user.id);

  const provider = getReconstructionProvider();
  const admin = await createAdminClient();

  const { data: scan, error } = await admin
    .from("scans")
    .insert({
      room_id: room.id,
      home_id: room.home_id,
      provider: provider.name,
      capture_type: (body.captureType ?? "photos") as never,
      is_simulated: provider.isSimulated
    })
    .select()
    .single();
  if (error) throw error;

  const { data: job, error: jobError } = await admin
    .from("reconstruction_jobs")
    .insert({
      scan_id: scan.id,
      home_id: room.home_id,
      room_id: room.id,
      provider: provider.name,
      status: "queued"
    })
    .select()
    .single();
  if (jobError) throw jobError;

  await admin.from("activity_events").insert({
    home_id: room.home_id,
    actor_id: user.id,
    type: "scan_started",
    payload: { scan_id: scan.id, room_id: room.id, simulated: provider.isSimulated }
  });

  return ok({ scan, job }, { status: 201 });
});
