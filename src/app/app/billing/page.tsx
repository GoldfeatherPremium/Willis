import { requireUser } from "@/lib/auth";
import { getUsageForUser } from "@/lib/server/quota";
import { BillingView } from "@/components/billing/billing-view";

export const dynamic = "force-dynamic";

export default async function BillingPage() {
  const user = await requireUser();
  const usage = await getUsageForUser(user.id);
  const simulated = (process.env.BILLING_PROVIDER || "simulated") === "simulated";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-primary">Billing</h1>
        <p className="mt-1 text-sm text-secondary">Your plan, quotas, and payments.</p>
      </div>
      <BillingView usage={usage} simulated={simulated} />
    </div>
  );
}
