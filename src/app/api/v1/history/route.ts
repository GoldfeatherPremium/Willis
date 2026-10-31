import { createClient } from "@/lib/supabase/server";
import {
  withErrorHandling,
  ok,
  requireApiUser,
  requireApiHomeAccess,
  ApiError
} from "@/lib/api-helpers";

export const GET = withErrorHandling(async (request) => {
  await requireApiUser();
  const url = new URL(request.url);
  const homeId = url.searchParams.get("homeId");
  if (!homeId) throw new ApiError(400, "Missing homeId query parameter.", "missing_param");
  await requireApiHomeAccess(homeId);

  const supabase = await createClient();
  const objectId = url.searchParams.get("objectId");

  const { data: events, error } = await supabase
    .from("activity_events")
    .select("id, type, payload, created_at")
    .eq("home_id", homeId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;

  let objectHistory: unknown[] = [];
  if (objectId) {
    const { data: hist } = await supabase
      .from("object_observations")
      .select("id, room_id, scan_id, position, observed_at, confidence, source, verification_status, created_at")
      .eq("object_id", objectId)
      .order("observed_at", { ascending: false })
      .limit(100);
    objectHistory = hist ?? [];
  }

  return ok({ events: events ?? [], objectHistory });
});
