import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Verify email" };

export default function VerifyPage() {
  return (
    <div className="text-center">
      <h1 className="font-display text-2xl font-bold text-primary">Check your email</h1>
      <p className="mt-2 text-sm leading-relaxed text-secondary">
        We sent you a verification link. Open it to activate your account,
        then sign in to build your first home.
      </p>
      <Link href="/login" className="mt-6 inline-block">
        <Button>Go to sign in</Button>
      </Link>
    </div>
  );
}
