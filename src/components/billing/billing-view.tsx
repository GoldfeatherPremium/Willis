"use client";

import * as React from "react";
import { Check, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/feedback";
import { PLANS, PLAN_ORDER, type PlanId } from "@/lib/config/plans";
import { formatCurrency } from "@/lib/utils";

interface BillingViewProps {
  usage: {
    plan: PlanId;
    homeCount: number;
    roomCount: number;
    capturesThisMonth: number;
    familyMemberCount: number;
    monthlyCaptureAllowance: number;
    maxHomes: number;
    maxRoomsPerHome: number;
    maxFamilyMembers: number;
  };
  simulated: boolean;
}

export function BillingView({ usage, simulated }: BillingViewProps) {
  const [loadingPlan, setLoadingPlan] = React.useState<PlanId | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  async function upgrade(planId: PlanId) {
    setLoadingPlan(planId);
    setError(null);
    try {
      const res = await fetch("/api/v1/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message ?? "Could not start checkout.");
      if (json.data.url) window.location.href = json.data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoadingPlan(null);
    }
  }

  return (
    <div className="space-y-8">
      {simulated && (
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Badge tone="warm">Simulated billing (dev)</Badge>
            <p className="text-sm text-secondary">No real charges are made on this deployment.</p>
          </div>
        </Card>
      )}
      {error && <div className="rounded-xl border border-error/25 bg-error/10 px-3.5 py-2.5 text-sm text-error">{error}</div>}

      <Card className="p-6">
        <h2 className="font-display text-base font-semibold text-primary">Current plan: {PLANS[usage.plan].name}</h2>
        <div className="mt-4 space-y-3">
          <UsageBar label="Homes" used={usage.homeCount} max={usage.maxHomes} />
          <UsageBar label="Rooms" used={usage.roomCount} max={usage.maxRoomsPerHome} />
          <UsageBar label="Room captures this month" used={usage.capturesThisMonth} max={usage.monthlyCaptureAllowance} />
          <UsageBar label="Family members" used={usage.familyMemberCount} max={usage.maxFamilyMembers} />
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {PLAN_ORDER.map((id) => {
          const plan = PLANS[id];
          const current = id === usage.plan;
          return (
            <Card key={id} className={"flex flex-col p-6 " + (current ? "border-accent/40 shadow-glow" : "")}>
              {current && <Badge tone="accent" className="self-start">Current</Badge>}
              <h3 className="mt-2 font-display text-lg font-bold text-primary">{plan.name}</h3>
              <p className="text-sm text-secondary">{plan.tagline}</p>
              <p className="mt-4">
                <span className="tnum font-display text-3xl font-bold text-primary">
                  {plan.priceCents === 0 ? "$0" : formatCurrency(plan.priceCents)}
                </span>
                {plan.priceCents > 0 && <span className="text-sm text-secondary">/month</span>}
              </p>
              <ul className="mt-5 space-y-2.5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-secondary">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                    {f}
                  </li>
                ))}
              </ul>
              <div className="mt-6 flex-1" />
              {current ? (
                <Button variant="secondary" disabled>Current plan</Button>
              ) : (
                <Button variant={id === "explorer" ? "ghost" : "primary"} onClick={() => upgrade(id)} loading={loadingPlan === id}>
                  {id === "explorer" ? "Downgrade" : "Upgrade"}
                </Button>
              )}
            </Card>
          );
        })}
      </div>

      <Card className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-accent" />
            <h3 className="font-display text-sm font-semibold text-primary">Billing & payment methods</h3>
          </div>
          <Button variant="secondary" onClick={() => fetch("/api/v1/billing/portal", { method: "POST" }).then((r) => r.json()).then((j) => { if (j?.data?.url) window.location.href = j.data.url; })}>
            Manage billing portal
          </Button>
        </div>
        <p className="mt-2 text-sm text-secondary">
          Payment methods, invoices, and cancellations are managed in the portal.
        </p>
      </Card>
    </div>
  );
}

function UsageBar({ label, used, max }: { label: string; used: number; max: number }) {
  const pct = max > 0 ? Math.min(100, (used / max) * 100) : 100;
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-sm">
        <span className="text-secondary">{label}</span>
        <span className="tnum text-primary">{used} / {max}</span>
      </div>
      <ProgressBar value={pct} />
    </div>
  );
}
