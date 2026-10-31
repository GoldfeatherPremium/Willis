import { withErrorHandling, ok, ApiError } from "@/lib/api-helpers";
import { runPendingJobs } from "@/lib/jobs/worker";

/**
 * Internal cron worker entrypoint. Called by Vercel Cron (vercel.json) with
 * header `x-internal-token` matching INTERNAL_WORKER_TOKEN.
 */
export const GET = withErrorHandling(async (request) => {
  const token = request.headers.get("x-internal-token");
  if (!process.env.INTERNAL_WORKER_TOKEN || token !== process.env.INTERNAL_WORKER_TOKEN) {
    throw new ApiError(401, "Unauthorized.", "unauthenticated");
  }

  const url = new URL(request.url);
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 1), 3);
  const { processed } = await runPendingJobs(limit);
  return ok({ processed, at: new Date().toISOString() });
});
