import { createClient, createAdminClient } from "@/lib/supabase/server";
import {
  withErrorHandling,
  ok,
  requireApiUser,
  requireApiHomeAccess,
  parseIdParam,
  ApiError
} from "@/lib/api-helpers";

/** Starts/retries processing. Idempotent. */
export const POST = withErrorHandling(async (_request, ctx) => {
  await requireApiUser();
  const scanId = parseIdParam((await ctx.params).id, "id");

  const supabase = await createClient();
  const { data: scan } = await supabase.from("scans").select("id, home_id, status").eq("id", scanId).maybeSingle();
  if (!scan) throw new ApiError(404, "Scan not found.", "not_found");
  await requireApiHomeAccess(scan.home_id);

  if (scan.status === "completed" || scan.status === "processing") {
    return ok({ started: false, reason: "already_processing" });
  }

  const admin = await createAdminClient();
  const { data: job } = await admin
    .from("reconstruction_jobs")
    .select("id, status")
    .eq("scan_id", scanId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  await admin.from("scans").update({ status: "validated", error: null }).eq("id", scanId);

  if (job) {
    await admin.from("reconstruction_jobs").update({ status: "queued", progress: 0, error: null }).eq("id", job.id);
  } else {
    await admin.from("reconstruction_jobs").insert({
      scan_id: scanId,
      home_id: scan.home_id,
      room_id: (await admin.from("scans").select("room_id").eq("id", scanId).single()).data?.room_id,
      provider: "simulated",
      status: "queued"
    });
  }

  return ok({ started: true });
});
