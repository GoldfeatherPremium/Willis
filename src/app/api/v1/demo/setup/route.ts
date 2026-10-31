import { createClient } from "@/lib/supabase/server";
import {
  withErrorHandling,
  ok,
  requireApiUser,
  ApiError
} from "@/lib/api-helpers";

/**
 * Creates a clearly-labelled demo home (is_demo = true) with sample rooms and
 * objects. Only enabled when DEMO_MODE=true (never in production).
 */
export const POST = withErrorHandling(async () => {
  if (process.env.DEMO_MODE !== "true") {
    throw new ApiError(404, "Demo mode is disabled.", "not_found");
  }
  const user = await requireApiUser();

  const supabase = await createClient();
  const { data: homeId, error } = await supabase.rpc("create_demo_home");
  if (error) throw error;

  return ok({ homeId, demoted: true }, { status: 201 });
});
