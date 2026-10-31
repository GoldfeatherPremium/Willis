import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Security" };

export default function SecurityPage() {
  return (
    <div className="min-h-dvh bg-bg text-primary">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <Link href="/" className="text-sm text-secondary hover:text-primary">← Back to site</Link>
        <h1 className="mt-4 font-display text-3xl font-bold tracking-tight">Security</h1>
        <div className="mt-8 space-y-6 text-sm leading-relaxed text-secondary">
          <section>
            <h2 className="font-display text-lg font-semibold text-primary">Authentication</h2>
            <p className="mt-2">
              Supabase Auth with email/password (verification required) and Google OAuth. Sessions live in
              httpOnly, secure cookies refreshed on every request.
            </p>
          </section>
          <section>
            <h2 className="font-display text-lg font-semibold text-primary">Authorization</h2>
            <p className="mt-2">
              Every API route checks the authenticated user and their membership in the home before touching data.
              Row-level security (RLS) enforces the same limits at the database layer, so even a compromised client
              cannot read another user’s records.
            </p>
          </section>
          <section>
            <h2 className="font-display text-lg font-semibold text-primary">Input validation & rate limiting</h2>
            <p className="mt-2">
              All request bodies are validated with Zod. API routes apply rate limiting, and signed upload URLs are
              scoped to the authenticated user’s private folder.
            </p>
          </section>
          <section>
            <h2 className="font-display text-lg font-semibold text-primary">Billing security</h2>
            <p className="mt-2">
              Subscription changes are enforced server-side. Stripe webhooks verify signatures before applying changes;
              quotas are checked in backend code, never trusted from the browser.
            </p>
          </section>
          <section>
            <h2 className="font-display text-lg font-semibold text-primary">Secrets</h2>
            <p className="mt-2">
              Service-role keys and provider credentials are server-only and never exposed to the browser. See
              .env.example for the full variable list.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
