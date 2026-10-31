import { describe, it, expect } from "vitest";
import { SimulatedBillingProvider } from "@/lib/payments/simulated";

describe("SimulatedBillingProvider", () => {
  const provider = new SimulatedBillingProvider();

  it("is labelled simulated", () => {
    expect(provider.isSimulated).toBe(true);
    expect(provider.name).toBe("simulated");
  });

  it("returns a checkout URL pointing at the in-app simulate endpoint", async () => {
    const { url } = await provider.createCheckoutSession({
      userId: "u1",
      planId: "personal",
      returnUrl: "http://localhost:3000/app/billing"
    });
    expect(url).toContain("/api/v1/billing/simulate");
    expect(url).toContain("planId=personal");
  });

  it("returns a portal URL", async () => {
    const { url } = await provider.createPortalSession({ userId: "u1", returnUrl: "http://localhost:3000/app/billing" });
    expect(url).toBe("http://localhost:3000/app/billing");
  });

  it("does not process webhooks", async () => {
    const res = await provider.handleWebhook(new Request("http://localhost/api"));
    expect(res.processed).toBe(false);
  });
});
