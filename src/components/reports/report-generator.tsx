"use client";

import * as React from "react";
import { FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { UserHome } from "@/lib/types/database";

export function ReportGenerator({ homes }: { homes: UserHome[] }) {
  const [generating, setGenerating] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<{ homeId: string; filename: string; url: string | null } | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  async function generate(homeId: string) {
    setGenerating(homeId);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/v1/reports/insurance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ homeId })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message ?? "Could not generate report.");
      setResult({ homeId, filename: json.data.filename, url: json.data.downloadUrl });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setGenerating(null);
    }
  }

  return (
    <div className="space-y-4">
      {error && <div className="rounded-xl border border-error/25 bg-error/10 px-3.5 py-2.5 text-sm text-error">{error}</div>}
      {result && (
        <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div>
            <p className="text-sm font-medium text-primary">Report ready: {result.filename}</p>
            <p className="text-xs text-secondary">Stored securely in your private exports folder.</p>
          </div>
          {result.url && (
            <a href={result.url} target="_blank" rel="noreferrer">
              <Button variant="secondary">
                <FileDown className="h-4 w-4" /> Download
              </Button>
            </a>
          )}
        </Card>
      )}

      {homes.map((h) => (
        <Card key={h.home_id} className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div>
            <p className="font-display text-sm font-semibold text-primary">{h.name}</p>
            <p className="text-xs text-secondary">{h.object_count} objects · CSV export</p>
          </div>
          <Button variant="secondary" onClick={() => generate(h.home_id)} loading={generating === h.home_id}>
            Generate insurance inventory
          </Button>
        </Card>
      ))}
    </div>
  );
}
