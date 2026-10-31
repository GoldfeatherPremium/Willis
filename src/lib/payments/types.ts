import type { PlanId } from "@/lib/config/plans";

export interface CheckoutParams {
  userId: string;
  planId: PlanId;
  /** Absolute URL to return to after checkout. */
  returnUrl: string;
}

export interface BillingProvider {
  readonly name: string;
  readonly isSimulated: boolean;
  /** Create a checkout session; returns the redirect URL. */
  createCheckoutSession(params: CheckoutParams): Promise<{ url: string }>;
  /** Create a billing-portal session; returns the redirect URL. */
  createPortalSession(params: { userId: string; returnUrl: string }): Promise<{ url: string }>;
  /**
   * Handle an incoming webhook request. Returns { processed } when the event
   * was recognized and applied. Called by the API route; the provider is
   * responsible for signature verification.
   */
  handleWebhook(request: Request): Promise<{ processed: boolean }>;
}

export class BillingError extends Error {
  constructor(message: string, public code = "billing_error") {
    super(message);
  }
}
