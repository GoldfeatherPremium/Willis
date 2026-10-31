import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <div className="min-h-dvh bg-bg text-primary">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <Link href="/" className="text-sm text-secondary hover:text-primary">← Back to site</Link>
        <h1 className="mt-4 font-display text-3xl font-bold tracking-tight">Privacy</h1>
        <div className="mt-8 space-y-6 text-sm leading-relaxed text-secondary">
          <section>
            <h2 className="font-display text-lg font-semibold text-primary">Your home is private. Your data should be too.</h2>
            <p className="mt-2">
              HomeAtlas is built around a privacy-sensitive promise: scans of your home are yours.
              We treat home imagery as private by default and design the product so that sharing is the exception, not the rule.
            </p>
          </section>
          <section>
            <h2 className="font-display text-lg font-semibold text-primary">Private-by-default storage</h2>
            <p className="mt-2">
              Photos, videos, reconstructed scenes, receipts, and exports live in private storage buckets.
              Files are never exposed on public URLs; access uses short-lived, signed URLs only for the owner and the family members they invite.
            </p>
          </section>
          <section>
            <h2 className="font-display text-lg font-semibold text-primary">Access control</h2>
            <p className="mt-2">
              Row-level security and server-side authorization gate every record. Only you and people you invite to a home can read its data.
            </p>
          </section>
          <section>
            <h2 className="font-display text-lg font-semibold text-primary">AI processing consent</h2>
            <p className="mt-2">
              Object recognition runs on your captures to provide the product’s core function. We do not use your captures
              to train models without explicit consent. You control any optional data-sharing setting from your account.
            </p>
          </section>
          <section>
            <h2 className="font-display text-lg font-semibold text-primary">Data export and deletion</h2>
            <p className="mt-2">
              You can export your inventory and delete your account at any time, which removes your profile and your data.
              Retention windows for backups are documented in our operations guide.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
