"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

/**
 * Clearly-labelled demo setup button. Only appears when DEMO_MODE=true
 * (server renders it only then).
 */
export function DemoSetupButton({ label }: { label: string }) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function setup() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/demo/setup", { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message ?? "Demo setup failed.");
      router.push(`/app/homes/${json.data.homeId}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      {error && <p className="text-sm text-error">{error}</p>}
      <Button variant="secondary" onClick={setup} loading={loading}>
        {label}
      </Button>
      <p className="text-xs text-secondary">
        Creates a sample home with rooms and objects — clearly marked as demo data.
      </p>
    </div>
  );
}
