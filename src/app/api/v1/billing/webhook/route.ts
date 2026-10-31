import {
  withErrorHandling,
  ok,
  ApiError
} from "@/lib/api-helpers";
import { getBillingProvider } from "@/lib/payments";

export const POST = withErrorHandling(async (request) => {
  const provider = getBillingProvider();
  if (provider.isSimulated) {
    // Simulated adapter has no webhook; dev plan changes go through /simulate.
    return ok({ processed: false, simulated: true });
  }

  try {
    const { processed } = await provider.handleWebhook(request);
    return ok({ processed });
  } catch (e) {
    throw new ApiError(400, e instanceof Error ? e.message : "Webhook error", "webhook_error");
  }
});
