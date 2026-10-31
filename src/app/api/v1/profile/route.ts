import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";
import { withErrorHandling, ok, requireApiUser } from "@/lib/api-helpers";

const profileSchema = z.object({
  fullName: z.string().trim().min(1).max(120)
});

export const PATCH = withErrorHandling(async (request) => {
  const user = await requireApiUser();
  const body = profileSchema.parse(await request.json());

  const admin = await createAdminClient();
  const { data: profile, error } = await admin
    .from("profiles")
    .update({ full_name: body.fullName })
    .eq("id", user.id)
    .select("id, full_name, avatar_url")
    .single();
  if (error) throw error;

  return ok({ profile });
});
