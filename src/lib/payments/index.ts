import type { BillingProvider } from "./types";
import { SimulatedBillingProvider } from "./simulated";
import { StripeBillingProvider } from "./stripe";

/**
 * Billing provider factory. Defaults to the clearly-labelled simulated adapter;
 * uses Stripe when BILLING_PROVIDER=stripe and credentials exist.
 */
export function getBillingProvider(): BillingProvider {
  const provider = process.env.BILLING_PROVIDER || "simulated";
  switch (provider) {
    case "stripe":
      // Construct lazily so a missing key raises only when actually used, and
      // the app can still run mocked in dev.
      return new StripeBillingProvider();
    case "simulated":
    default:
      return new SimulatedBillingProvider();
  }
}

export type { BillingProvider, CheckoutParams } from "./types";
export { BillingError } from "./types";
