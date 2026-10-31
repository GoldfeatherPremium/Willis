import { createAdminClient } from "@/lib/supabase/server";
import { evaluateUsage, getPlan, type PlanId } from "@/lib/config/plans";
import { ApiError } from "@/lib/api-helpers";

export interface UsageSnapshot {
  plan: PlanId;
  homeCount: number;
  roomCount: number;
  capturesThisMonth: number;
  familyMemberCount: number;
  monthlyCaptureAllowance: number;
  maxHomes: number;
  maxRoomsPerHome: number;
  maxFamilyMembers: number;
}

/**
 * Loads usage counters and the user's active plan (service-role client).
 */
export async function getUsageForUser(userId: string): Promise<UsageSnapshot> {
  const admin = await createAdminClient();

  const [{ data: sub }, { count: homeCount }, { count: familyMemberCount }] =
    await Promise.all([
      admin
        .from("subscriptions")
        .select("plan")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      admin
        .from("homes")
        .select("id", { count: "exact", head: true })
        .eq("owner_id", userId)
        .is("archived_at", null),
      admin
        .from("home_members")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
    ]);

  const planId = (sub?.plan ?? "explorer") as PlanId;
  const plan = getPlan(planId);

  const { data: rooms } = await admin
    .from("rooms")
    .select("home_id, id", { count: "exact" })
    .in(
      "home_id",
      (await admin.from("homes").select("id").eq("owner_id", userId).is("archived_at", null))
        .data?.map((h) => h.id) ?? []
    )
    .is("archived_at", null);

  const { count: capturesThisMonth } = await admin
    .from("scans")
    .select("id", { count: "exact", head: true })
    .in(
      "home_id",
      (await admin.from("homes").select("id").eq("owner_id", userId).is("archived_at", null))
        .data?.map((h) => h.id) ?? []
    )
    .gte("created_at", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
    .neq("status", "canceled");

  return {
    plan: planId,
    homeCount: homeCount ?? 0,
    roomCount: rooms?.length ?? 0,
    capturesThisMonth: capturesThisMonth ?? 0,
    familyMemberCount: familyMemberCount ?? 0,
    monthlyCaptureAllowance: plan.monthlyCaptureAllowance,
    maxHomes: plan.maxHomes,
    maxRoomsPerHome: plan.maxRoomsPerHome,
    maxFamilyMembers: plan.maxFamilyMembers
  };
}

/** Throws ApiError(403/402) when a home-creation limit is exceeded. */
export async function assertCanCreateHome(userId: string) {
  const usage = await getUsageForUser(userId);
  const limits = evaluateUsage(getPlan(usage.plan), usage);
  if (limits.exceeded.homes) {
    throw new ApiError(
      402,
      `Your ${usage.plan} plan allows up to ${usage.maxHomes} home(s). Upgrade to add more.`,
      "quota_exceeded"
    );
  }
}

export async function assertCanCreateRoom(userId: string) {
  const usage = await getUsageForUser(userId);
  const limits = evaluateUsage(getPlan(usage.plan), usage);
  if (limits.exceeded.rooms) {
    throw new ApiError(
      402,
      `Your ${usage.plan} plan allows up to ${usage.maxRoomsPerHome} rooms per home. Upgrade to add more.`,
      "quota_exceeded"
    );
  }
}

export async function assertCanStartScan(userId: string) {
  const usage = await getUsageForUser(userId);
  const limits = evaluateUsage(getPlan(usage.plan), usage);
  if (limits.exceeded.captures) {
    throw new ApiError(
      402,
      `You've used all ${usage.monthlyCaptureAllowance} room captures for this month on ${usage.plan}. Upgrade for more.`,
      "quota_exceeded"
    );
  }
}

export async function assertCanAddFamilyMember(userId: string) {
  const usage = await getUsageForUser(userId);
  const limits = evaluateUsage(getPlan(usage.plan), usage);
  if (limits.exceeded.familyMembers) {
    throw new ApiError(
      402,
      `Your ${usage.plan} plan allows up to ${usage.maxFamilyMembers} family members. Upgrade to add more.`,
      "quota_exceeded"
    );
  }
}
