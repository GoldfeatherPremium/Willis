import { z } from "zod";
import {
  withErrorHandling,
  ok,
  requireApiUser
} from "@/lib/api-helpers";
import { getBillingProvider } from "@/lib/payments";
import { PLAN_IDS } from "@/lib/types/constants";

const checkoutSchema = z.object({
  planId: z.enum(PLAN_IDS)
});

export const POST = withErrorHandling(async (request) => {
  const user = await requireApiUser();
  const body = checkoutSchema.parse(await request.json());

  const provider = getBillingProvider();
  const returnUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/app/billing`;

  const { url } = await provider.createCheckoutSession({
    userId: user.id,
    planId: body.planId,
    returnUrl
  });

  return ok({ url, provider: provider.name, simulated: provider.isSimulated });
});
