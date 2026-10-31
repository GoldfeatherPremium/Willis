import Link from "next/link";
import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = { title: "Features" };

const FEATURES = [
  { title: "3D room viewer", body: "Orbit, zoom, and select rooms. Object hotspots open details. A 2D inventory fallback covers low-power devices." },
  { title: "Spatial memory", body: "Objects are tied to rooms, containers, furniture, observations, and historical locations — not just a photo." },
  { title: "Natural-language assistant", body: "Ask about any belonging. Answers come from your real scanned data and never invent locations." },
  { title: "Object detection", body: "Vision AI identifies furniture, electronics, appliances, books, accessories, clothing, collectibles, and storage." },
  { title: "Documents & warranties", body: "Attach receipts, manuals, and warranties to objects and find items without coverage." },
  { title: "Reports", body: "Generate insurance and moving inventories from your inventory as CSV." },
  { title: "Family sharing", body: "Invite household members with role-based access (owner, admin, member, viewer)." },
  { title: "Privacy & export", body: "Private-by-default storage, signed URLs, data export, and full account deletion." }
];

export default function FeaturesPage() {
  return (
    <div className="min-h-dvh bg-bg text-primary">
      <div className="mx-auto max-w-5xl px-6 py-16">
        <Link href="/" className="text-sm text-secondary hover:text-primary">← Back to site</Link>
        <h1 className="mt-4 font-display text-3xl font-bold tracking-tight">Features</h1>
        <p className="mt-3 text-secondary">Everything you need to remember where your world lives.</p>
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {FEATURES.map((f) => (
            <Card key={f.title} className="p-6">
              <h3 className="font-display text-base font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-secondary">{f.body}</p>
            </Card>
          ))}
        </div>
        <div className="mt-10 text-center">
          <Link href="/signup"><Button size="lg">Get started free</Button></Link>
        </div>
      </div>
    </div>
  );
}
