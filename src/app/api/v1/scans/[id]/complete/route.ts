import { createClient, createAdminClient } from "@/lib/supabase/server";
import {
  withErrorHandling,
  ok,
  requireApiUser,
  requireApiHomeAccess,
  parseIdParam,
  ApiError
} from "@/lib/api-helpers";
import { getReconstructionProvider } from "@/lib/reconstruction";

/**
 * Marks a scan's uploads as finished and starts processing (queues the job).
 * Idempotent: if the scan is already processing/completed, it just returns the
 * current job state.
 *
 * When the reconstruction provider is the simulated adapter, the job is
 * drained inline (bounded, ~1–2s) so the full dev flow completes immediately;
 * real providers are polled by the cron worker.
 */
export const POST = withErrorHandling(async (_request, ctx) => {
  await requireApiUser();
  const scanId = parseIdParam((await ctx.params).id, "id");

  const supabase = await createClient();
  const { data: scan } = await supabase.from("scans").select("id, home_id, status").eq("id", scanId).maybeSingle();
  if (!scan) throw new ApiError(404, "Scan not found.", "not_found");
  await requireApiHomeAccess(scan.home_id);

  const admin = await createAdminClient();
  let requeued = false;

  if (scan.status === "pending" || scan.status === "failed") {
    await admin.from("scans").update({ status: "validated", error: null }).eq("id", scanId);

    const { data: job } = await admin
      .from("reconstruction_jobs")
      .select("id, status")
      .eq("scan_id", scanId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (job && job.status !== "queued" && job.status !== "running") {
      await admin.from("reconstruction_jobs").update({ status: "queued", progress: 0, error: null }).eq("id", job.id);
      requeued = true;
    } else if (!job) {
      const { data: roomInfo } = await admin.from("scans").select("room_id").eq("id", scanId).single();
      await admin.from("reconstruction_jobs").insert({
        scan_id: scanId,
        home_id: scan.home_id,
        room_id: roomInfo?.room_id,
        provider: "simulated",
        status: "queued"
      });
      requeued = true;
    }
  }

  // Inline drain for the simulated provider (dev flow completes instantly).
  const provider = getReconstructionProvider();
  if (requeued && provider.isSimulated) {
    const { runPendingJobs } = await import("@/lib/jobs/worker");
    try {
      await runPendingJobs(1);
    } catch {
      // The cron worker will retry; never fail the response for this.
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
