import Link from "next/link";
import type { Metadata } from "next";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <div className="min-h-dvh bg-bg text-primary">
      <div className="mx-auto max-w-2xl px-6 py-16">
        <Link href="/" className="text-sm text-secondary hover:text-primary">← Back to site</Link>
        <h1 className="mt-4 font-display text-3xl font-bold tracking-tight">Contact</h1>
        <p className="mt-3 text-secondary">We read every message.</p>
        <Card className="mt-8 p-6">
          <h2 className="font-display text-lg font-semibold">Email</h2>
          <p className="mt-2 text-sm text-secondary">
            <a href="mailto:hello@homeatlas.com" className="text-accent hover:underline">hello@homeatlas.com</a>
          </p>
          <h2 className="mt-6 font-display text-lg font-semibold">Support</h2>
          <p className="mt-2 text-sm text-secondary">
            Opening a support ticket inside the app reaches the same team. For account or billing questions, include your email.
          </p>
          <h2 className="mt-6 font-display text-lg font-semibold">Press & partnerships</h2>
          <p className="mt-2 text-sm text-secondary">
            <a href="mailto:press@homeatlas.com" className="text-accent hover:underline">press@homeatlas.com</a>
          </p>
        </Card>
      </div>
    </div>
  );
}
