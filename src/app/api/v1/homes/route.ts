import { z } from "zod";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { withErrorHandling, ok, requireApiUser } from "@/lib/api-helpers";
import { assertCanCreateHome } from "@/lib/server/quota";
import { HOME_TYPES } from "@/lib/types/constants";

const createHomeSchema = z.object({
  name: z.string().trim().min(1).max(120),
  homeType: z.enum(HOME_TYPES).optional(),
  address: z.string().trim().max(240).optional().nullable()
});

export const GET = withErrorHandling(async () => {
  const user = await requireApiUser();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("user_homes")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return ok({ homes: data ?? [] });
});

export const POST = withErrorHandling(async (request) => {
  const user = await requireApiUser();
  const body = createHomeSchema.parse(await request.json());

  await assertCanCreateHome(user.id);

  const admin = await createAdminClient();
  const { data: home, error } = await admin
    .from("homes")
    .insert({
      owner_id: user.id,
      name: body.name,
      home_type: (body.homeType ?? "house") as never,
      address: body.address ?? null
    })
    .select()
    .single();

  if (error) throw error;

  const { error: memberError } = await admin.from("home_members").insert({
    home_id: home.id,
    user_id: user.id,
    role: "owner"
  });
  if (memberError) throw memberError;

  await admin.from("activity_events").insert({
    home_id: home.id,
    actor_id: user.id,
    type: "home_created",
    payload: { name: home.name }
  });

  return ok({ home }, { status: 201 });
});
