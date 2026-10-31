import Link from "next/link";
import { ArrowRight, ScanLine, Sparkles, MapPin, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/brand/icon";
import { PLANS, PLAN_ORDER } from "@/lib/config/plans";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default function LandingPage() {
  return (
    <div className="min-h-dvh bg-bg text-primary">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link href="/" className="flex items-center gap-2">
          <Icon className="h-7 w-7" />
          <span className="font-display text-lg font-bold tracking-tight">HomeAtlas</span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-secondary md:flex">
          <Link href="/how-it-works" className="transition-colors hover:text-primary">How it works</Link>
          <Link href="/features" className="transition-colors hover:text-primary">Features</Link>
          <Link href="/pricing" className="transition-colors hover:text-primary">Pricing</Link>
          <Link href="/security" className="transition-colors hover:text-primary">Security</Link>
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm font-medium text-secondary transition-colors hover:text-primary">Sign in</Link>
          <Link href="/signup"><Button size="sm">Create My Home</Button></Link>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pb-20 pt-16 text-center">
        <p className="text-sm font-medium text-accent">Your world, reconstructed. Your belongings, remembered.</p>
        <h1 className="mx-auto mt-4 max-w-3xl font-display text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
          Your home. Reimagined as a living digital world.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-secondary">
          Scan your space. Discover your belongings. Let AI remember where everything lives.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/signup"><Button size="lg">Create My Home <ArrowRight className="h-4 w-4" /></Button></Link>
          <Link href="/how-it-works"><Button size="lg" variant="secondary">Explore the Experience</Button></Link>
        </div>
      </section>

      {/* Value props */}
      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: ScanLine, title: "Scan your rooms", body: "Photograph or record a room with your phone. We reconstruct it in 3D." },
            { icon: Sparkles, title: "AI identifies belongings", body: "Object recognition suggests what it finds. You confirm or correct — your data stays yours." },
            { icon: MapPin, title: "Spatial memory", body: "Every object keeps a last-observed location, with history across scans." },
            { icon: ShieldCheck, title: "Private by default", body: "Private storage, row-level security, and you-controlled AI sharing." }
          ].map((f) => (
            <Card key={f.title} className="p-6">
              <f.icon className="h-5 w-5 text-accent" />
              <h3 className="mt-4 font-display text-base font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-secondary">{f.body}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Pricing teaser */}
      <section className="mx-auto max-w-6xl px-6 pb-20">
        <h2 className="text-center font-display text-2xl font-bold">Simple plans that grow with your home</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {PLAN_ORDER.map((id) => {
            const p = PLANS[id];
            return (
              <Card key={id} className="flex flex-col p-6">
                <h3 className="font-display text-base font-semibold">{p.name}</h3>
                <p className="mt-1 text-sm text-secondary">{p.tagline}</p>
                <p className="mt-4 font-display text-3xl font-bold">
                  {p.priceCents === 0 ? "$0" : formatCurrency(p.priceCents)}
                  {p.priceCents > 0 && <span className="text-sm font-normal text-secondary">/month</span>}
                </p>
                <ul className="mt-5 space-y-2 text-sm text-secondary">
                  {p.features.slice(0, 4).map((f) => <li key={f}>· {f}</li>)}
                </ul>
                <div className="mt-6 flex-1" />
                <Link href="/pricing"><Button variant={id === "explorer" ? "secondary" : "primary"} className="w-full">{id === "explorer" ? "Start free" : "See plans"}</Button></Link>
              </Card>
            );
          })}
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-8 text-sm text-secondary">
          <div className="flex items-center gap-2">
            <Icon className="h-5 w-5" />
            <span>© {new Date().getFullYear()} HomeAtlas by ReconstructAI</span>
          </div>
          <div className="flex flex-wrap gap-5">
            <Link href="/privacy" className="hover:text-primary">Privacy</Link>
            <Link href="/security" className="hover:text-primary">Security</Link>
            <Link href="/faq" className="hover:text-primary">FAQ</Link>
            <Link href="/contact" className="hover:text-primary">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
