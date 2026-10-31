import Stripe from "stripe";
import type { BillingProvider, CheckoutParams } from "./types";

/**
 * Stripe billing adapter. Requires STRIPE_SECRET_KEY (+ webhook secret).
 * Inert until credentials exist; throws a descriptive error otherwise so the
 * app never silently degrades.
 */
export class StripeBillingProvider implements BillingProvider {
  readonly name = "stripe";
  readonly isSimulated = false;

  private stripe: Stripe;
  private priceIds: Record<string, string>;

  constructor() {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error("STRIPE_SECRET_KEY is not configured (Stripe adapter).");
    }
    this.stripe = new Stripe(key);
    this.priceIds = {
      explorer: process.env.STRIPE_PRICE_EXPLORER || "",
      personal: process.env.STRIPE_PRICE_PERSONAL || "",
      family: process.env.STRIPE_PRICE_FAMILY || "",
      collector: process.env.STRIPE_PRICE_COLLECTOR || ""
    };
  }

  private async getOrCreateCustomer(userId: string) {
    // Upsert stripe_customer_id on the subscription row.
    const { createAdminClient } = await import("@/lib/supabase/server");
    const admin = await createAdminClient();
    const { data: sub } = await admin
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (sub?.stripe_customer_id) return sub.stripe_customer_id;

    const customer = await this.stripe.customers.create({
      metadata: { userId }
    });
    await admin
      .from("subscriptions")
      .update({ stripe_customer_id: customer.id })
      .eq("user_id", userId);
    return customer.id;
  }

  async createCheckoutSession(params: CheckoutParams): Promise<{ url: string }> {
    const priceId = this.priceIds[params.planId];
    if (!priceId) {
      throw new Error(`No Stripe price configured for plan "${params.planId}".`);
    }
    const customerId = await this.getOrCreateCustomer(params.userId);
    const session = await this.stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${params.returnUrl}?checkout=success`,
      cancel_url: params.returnUrl,
      subscription_data: { metadata: { userId: params.userId } },
      metadata: { userId: params.userId, planId: params.planId }
    });
    if (!session.url) throw new Error("Stripe did not return a checkout URL.");
    return { url: session.url };
  }

  async createPortalSession(params: {
    userId: string;
    returnUrl: string;
  }): Promise<{ url: string }> {
    const customerId = await this.getOrCreateCustomer(params.userId);
    const session = await this.stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: params.returnUrl
    });
    return { url: session.url };
  }

  async handleWebhook(request: Request): Promise<{ processed: boolean }> {
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret) throw new Error("STRIPE_WEBHOOK_SECRET is not configured.");

    const signature = request.headers.get("stripe-signature");
    if (!signature) throw new Error("Missing Stripe signature header.");

    const body = await request.text();
    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(body, signature, secret);
    } catch {
      throw new Error("Invalid Stripe webhook signature.");
    }

    const { createAdminClient } = await import("@/lib/supabase/server");
    const admin = await createAdminClient();
    const userId = event.data.object?.metadata?.userId as string | undefined;

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const uid = session.metadata?.userId;
        if (!uid) break;
        const planId = session.metadata?.planId ?? "personal";
        await admin
          .from("subscriptions")
          .update({
            plan: planId as never,
            status: "active",
            stripe_subscription_id: (session.subscription as string) ?? null,
            current_period_start: new Date().toISOString(),
            price_cents: 0
          })
          .eq("user_id", uid);
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        if (!userId) break;
        await admin
          .from("subscriptions")
          .update({ status: sub.status as never })
          .eq("user_id", userId);
        break;
      }
      case "invoice.payment_failed": {
        if (!userId) break;
        await admin
          .from("subscriptions")
          .update({ status: "past_due" })
          .eq("user_id", userId);
        break;
      }
      default:
        return { processed: false };
    }

    return { processed: true };
  }
}
