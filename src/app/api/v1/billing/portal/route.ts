import {
  withErrorHandling,
  ok,
  requireApiUser
} from "@/lib/api-helpers";
import { getBillingProvider } from "@/lib/payments";

export const POST = withErrorHandling(async () => {
  const user = await requireApiUser();
  const provider = getBillingProvider();
  const returnUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/app/billing`;
  const { url } = await provider.createPortalSession({ userId: user.id, returnUrl });
  return ok({ url });
});
