import { createClient } from "@/lib/supabase/server";
import {
  withErrorHandling,
  ok,
  requireApiUser,
  parseIdParam,
  ApiError
} from "@/lib/api-helpers";

export const GET = withErrorHandling(async (_request, ctx) => {
  await requireApiUser();
  const jobId = parseIdParam((await ctx.params).id, "id");

  const supabase = await createClient();
  const { data: job, error } = await supabase
    .from("reconstruction_jobs")
    .select("id, scan_id, home_id, room_id, provider, status, progress, error, result_type, result_uri, completed_at, created_at, updated_at")
    .eq("id", jobId)
    .maybeSingle();

  if (error) throw error;
  if (!job) throw new ApiError(404, "Job not found.", "not_found");

  // RLS on reconstruction_jobs already restricted to home members; double-check
  // via the join table through the user session (query would return empty).
  return ok({ job });
});
