import Link from "next/link";
import type { Metadata } from "next";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PLANS, PLAN_ORDER } from "@/lib/config/plans";
import { formatCurrency } from "@/lib/utils";

export const metadata: Metadata = { title: "Pricing" };

export default function PricingPage() {
  return (
    <div className="min-h-dvh bg-bg text-primary">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <Link href="/" className="text-sm text-secondary hover:text-primary">← Back to site</Link>
        <h1 className="mt-4 font-display text-3xl font-bold tracking-tight">Pricing</h1>
        <p className="mt-3 text-secondary">Start free. Upgrade when your home grows.</p>
        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {PLAN_ORDER.map((id) => {
            const p = PLANS[id];
            return (
              <Card key={id} className="flex flex-col p-6">
                <h3 className="font-display text-lg font-bold">{p.name}</h3>
                <p className="mt-1 text-sm text-secondary">{p.tagline}</p>
                <p className="mt-4 font-display text-3xl font-bold">
                  {p.priceCents === 0 ? "$0" : formatCurrency(p.priceCents)}
                  {p.priceCents > 0 && <span className="text-sm font-normal text-secondary">/month</span>}
                </p>
                <ul className="mt-5 space-y-2.5">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-secondary">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" /> {f}
                    </li>
                  ))}
                </ul>
                <div className="mt-6 flex-1" />
                <Link href="/signup"><Button variant={id === "explorer" ? "secondary" : "primary"} className="w-full">
                  {id === "explorer" ? "Start free" : "Get started"}
                </Button></Link>
              </Card>
            );
          })}
        </div>
        <p className="mt-8 text-center text-sm text-secondary">
          Questions? <Link href="/contact" className="text-accent hover:underline">Contact us</Link>.
        </p>
      </div>
    </div>
  );
}
