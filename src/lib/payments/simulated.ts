import type { BillingProvider, CheckoutParams } from "./types";

/**
 * Development billing adapter. No real charges are created. Checkout returns a
 * URL to the in-app simulate endpoint (dev only). Every flow is clearly
 * labelled in the UI.
 */
export class SimulatedBillingProvider implements BillingProvider {
  readonly name = "simulated";
  readonly isSimulated = true;

  private appUrl() {
    return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  }

  async createCheckoutSession(params: CheckoutParams): Promise<{ url: string }> {
    const url = new URL("/api/v1/billing/simulate", this.appUrl());
    url.searchParams.set("planId", params.planId);
    url.searchParams.set("returnUrl", params.returnUrl);
    return { url: url.toString() };
  }

  async createPortalSession(params: {
    userId: string;
    returnUrl: string;
  }): Promise<{ url: string }> {
    return { url: params.returnUrl };
  }

  async handleWebhook(request: Request): Promise<{ processed: boolean }> {
    // The simulated adapter never receives signed webhooks; the /simulate
    // endpoint drives plan changes in dev.
    return { processed: false };
  }
}
