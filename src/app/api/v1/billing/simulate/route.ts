import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";
import {
  withErrorHandling,
  ok,
  requireApiUser,
  ApiError
} from "@/lib/api-helpers";
import { PLAN_IDS } from "@/lib/types/constants";

/**
 * DEV-ONLY simulated billing endpoint. Only active when the billing provider
 * is "simulated" and not in production.
 */
function simulateEnabled() {
  return (
    process.env.BILLING_PROVIDER === "simulated" &&
    process.env.NODE_ENV !== "production"
  );
}

const simulateSchema = z.object({
  planId: z.enum(PLAN_IDS),
  returnUrl: z.string().url().optional()
});

export const POST = withErrorHandling(async (request) => {
  if (!simulateEnabled()) {
    throw new ApiError(404, "Not available.", "not_found");
  }
  const user = await requireApiUser();
  const body = simulateSchema.parse(await request.json());

  const admin = await createAdminClient();
  await admin
    .from("subscriptions")
    .update({ plan: body.planId as never, status: "active" })
    .eq("user_id", user.id);

  await admin.from("activity_events").insert({
    type: "subscription_changed",
    payload: { plan: body.planId, simulated: true }
  });

  return ok({ applied: true, plan: body.planId, simulated: true });
});

export const GET = withErrorHandling(async (request) => {
  if (!simulateEnabled()) {
    throw new ApiError(404, "Not available.", "not_found");
  }
  const user = await requireApiUser();
  const url = new URL(request.url);
  const planId = url.searchParams.get("planId");
  const returnUrl = url.searchParams.get("returnUrl");
  if (!planId || !PLAN_IDS.includes(planId as never)) {
    throw new ApiError(400, "planId is required.", "validation_error");
  }

  const admin = await createAdminClient();
  await admin
    .from("subscriptions")
    .update({ plan: planId as never, status: "active" })
    .eq("user_id", user.id);

  const { NextResponse } = await import("next/server");
  return NextResponse.redirect(returnUrl || `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/app/billing`);
});
