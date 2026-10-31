import Link from "next/link";
import type { Metadata } from "next";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = { title: "FAQ" };

const FAQS = [
  { q: "How many photos do I need to scan a room?", a: "At least 3 photos from different angles work; 8+ gives better coverage. A short continuous video also works." },
  { q: "Is the reconstruction real or simulated?", a: "The app ships with a clearly-labelled simulated reconstruction adapter so the full journey works without external credentials. Connect a real photogrammetry provider (see docs) and the same pipeline produces real reconstructions." },
  { q: "Can I trust where AI says my objects are?", a: "Every answer comes from your real observations. AI-suggested objects are unverified until you confirm them, and the assistant never invents a location." },
  { q: "What happens when I install a plan?", a: "Quotas are enforced on the backend. The free Explorer plan includes 1 home, 1 room, and 2 captures/month. Upgrade anytime from Billing." },
  { q: "Who can see my home?", a: "Only you and the family members you invite. Everything is private by default and protected by row-level security." },
  { q: "Can I export or delete my data?", a: "Yes — export insurance inventories as CSV, and delete your account entirely from Settings." }
];

export default function FagPage() {
  return (
    <div className="min-h-dvh bg-bg text-primary">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <Link href="/" className="text-sm text-secondary hover:text-primary">← Back to site</Link>
        <h1 className="mt-4 font-display text-3xl font-bold tracking-tight">Frequently asked questions</h1>
        <div className="mt-8 space-y-4">
          {FAQS.map((f) => (
            <Card key={f.q} className="p-6">
              <h3 className="font-display text-base font-semibold text-primary">{f.q}</h3>
              <p className="mt-2 text-sm leading-relaxed text-secondary">{f.a}</p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
