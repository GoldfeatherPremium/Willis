import { createClient, createAdminClient } from "@/lib/supabase/server";
import {
  withErrorHandling,
  ok,
  requireApiUser,
  requireApiHomeAccess,
  parseIdParam,
  ApiError
} from "@/lib/api-helpers";

/**
 * Marks a scan's uploads as finished and starts processing (queues the job).
 * Idempotent: if the scan is already processing/completed, it just returns the
 * current job state.
 */
export const POST = withErrorHandling(async (_request, ctx) => {
  await requireApiUser();
  const scanId = parseIdParam((await ctx.params).id, "id");

  const supabase = await createClient();
  const { data: scan } = await supabase.from("scans").select("id, home_id, status").eq("id", scanId).maybeSingle();
  if (!scan) throw new ApiError(404, "Scan not found.", "not_found");
  await requireApiHomeAccess(scan.home_id);

  const admin = await createAdminClient();

  if (scan.status === "pending" || scan.status === "failed") {
    const { error } = await admin
      .from("scans")
      .update({ status: "validated", error: null })
      .eq("id", scanId);
    if (error) throw error;

    const { data: job } = await admin
      .from("reconstruction_jobs")
      .select("id, status")
      .eq("scan_id", scanId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (job && job.status !== "queued" && job.status !== "running") {
      await admin.from("reconstruction_jobs").update({ status: "queued", progress: 0, error: null }).eq("id", job.id);
    } else if (!job) {
      const { error: jobError } = await admin.from("reconstruction_jobs").insert({
        scan_id: scanId,
        home_id: scan.home_id,
        room_id: (await admin.from("scans").select("room_id").eq("id", scanId).single()).data?.room_id,
        provider: "simulated",
        status: "queued"
      });
      if (jobError) throw jobError;
    }
  }

  const { data: job } = await admin
    .from("reconstruction_jobs")
    .select("id, status, progress, error, result_type, result_uri, completed_at")
    .eq("scan_id", scanId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return ok({ scanId, job });
});
