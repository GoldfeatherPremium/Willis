import Link from "next/link";
import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = { title: "How it works" };

const STEPS = [
  { n: "01", title: "Create your home", body: "Sign up and name your space. You only need one room to start." },
  { n: "02", title: "Scan a room", body: "Upload 3+ photos or a short video from your phone. We validate quality and start a reconstruction job." },
  { n: "03", title: "Reconstruction", body: "A photogrammetry pipeline turns your captures into a 3D representation — mesh, point cloud, or gaussian splat depending on the provider." },
  { n: "04", title: "AI discovers objects", body: "Vision AI suggests candidate belongings with bounding boxes and confidence. You confirm, rename, or correct." },
  { n: "05", title: "Search & remember", body: "Ask “where is my camera battery?” and get the last-observed location, timestamp, and confidence." },
  { n: "06", title: "Track & report", body: "Rescan to detect movement, attach receipts and warranties, and generate insurance or moving inventories." }
];

export default function HowItWorksPage() {
  return (
    <div className="min-h-dvh bg-bg text-primary">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <Link href="/" className="text-sm text-secondary hover:text-primary">← Back to site</Link>
        <h1 className="mt-4 font-display text-3xl font-bold tracking-tight">How HomeAtlas works</h1>
        <p className="mt-3 text-secondary">From real life to a digital twin you can search.</p>
        <div className="mt-10 space-y-4">
          {STEPS.map((s) => (
            <Card key={s.n} className="flex gap-5 p-6">
              <span className="tnum font-display text-2xl font-bold text-accent">{s.n}</span>
              <div>
                <h3 className="font-display text-lg font-semibold">{s.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-secondary">{s.body}</p>
              </div>
            </Card>
          ))}
        </div>
        <div className="mt-10 text-center">
          <Link href="/signup"><Button size="lg">Create My Home</Button></Link>
        </div>
      </div>
    </div>
  );
}
