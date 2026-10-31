import { createAdminClient } from "@/lib/supabase/server";
import { withErrorHandling, ok, requireApiUser } from "@/lib/api-helpers";

/**
 * Permanently deletes the current user's Supabase Auth account. Cascades to
 * profiles and all user-owned records (FKs are ON DELETE CASCADE). Storage can
 * be purged separately by retention jobs.
 */
export const POST = withErrorHandling(async () => {
  const user = await requireApiUser();
  const admin = await createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) throw error;
  return ok({ deleted: true });
});
