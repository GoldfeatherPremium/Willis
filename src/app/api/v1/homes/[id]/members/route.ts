import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";
import {
  withErrorHandling,
  ok,
  requireApiUser,
  requireApiHomeAccess,
  parseIdParam,
  ApiError
} from "@/lib/api-helpers";
import { assertCanAddFamilyMember } from "@/lib/server/quota";

const addMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(["admin", "member", "viewer"]).optional()
});

export const POST = withErrorHandling(async (request, ctx) => {
  const user = await requireApiUser();
  const homeId = parseIdParam((await ctx.params).id, "id");

  const access = await requireApiHomeAccess(homeId);
  if (access.role === "viewer" || access.role === "member") {
    throw new ApiError(403, "Only owners and admins can add members.", "forbidden");
  }

  const body = addMemberSchema.parse(await request.json());
  await assertCanAddFamilyMember(user.id);

  const admin = await createAdminClient();
  const { data: users, error: usersError } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (usersError) throw usersError;

  const match = users.users.find((u) => u.email?.toLowerCase() === body.email.toLowerCase());
  if (!match) {
    throw new ApiError(404, "No HomeAtlas account found for that email.", "not_found");
  }

  const { data: existing } = await admin
    .from("home_members")
    .select("id")
    .eq("home_id", homeId)
    .eq("user_id", match.id)
    .maybeSingle();
  if (existing) throw new ApiError(409, "That person is already a member.", "conflict");

  const { error } = await admin.from("home_members").insert({
    home_id: homeId,
    user_id: match.id,
    role: body.role ?? "member"
  });
  if (error) throw error;

  await admin.from("notifications").insert({
    user_id: match.id,
    home_id: homeId,
    type: "family_invite",
    title: "You were added to a home",
    body: `You can now view and contribute to this home in HomeAtlas.`,
    link: `/app/homes/${homeId}`
  });
  await admin.from("activity_events").insert({
    home_id: homeId,
    actor_id: user.id,
    type: "member_added",
    payload: { email: body.email, role: body.role ?? "member" }
  });

  return ok({ added: true, userId: match.id }, { status: 201 });
});
