"use client";

import * as React from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { formatRelativeTime } from "@/lib/utils";

interface InvObject {
  id: string;
  name: string;
  category: string;
  brand: string | null;
  model: string | null;
  is_demo: boolean;
  ai_extracted: unknown;
  created_at: string;
  room: { name: string } | null;
  location: { observed_at: string; confidence: number; verification_status: string } | null;
}

export function InventoryGrid({ homeId, objects }: { homeId: string; objects: InvObject[] }) {
  const [q, setQ] = React.useState("");
  const filtered = q.trim()
    ? objects.filter((o) =>
        [o.name, o.category, o.brand ?? "", o.model ?? "", o.room?.name ?? ""]
          .join(" ")
          .toLowerCase()
          .includes(q.toLowerCase())
      )
    : objects;

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary" />
        <Input
          className="pl-10"
          placeholder="Search your belongings…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <Card className="p-10 text-center text-sm text-secondary">No objects match “{q}”.</Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((o) => (
            <Link key={o.id} href={`/app/homes/${homeId}/inventory/${o.id}`}>
              <Card className="h-full p-5 transition-all hover:-translate-y-0.5 hover:border-accent/30">
                <div className="flex items-start justify-between gap-2">
                  <Badge tone="muted">{o.category}</Badge>
                  {o.is_demo && <Badge tone="warm">Demo</Badge>}
                </div>
                <h3 className="mt-3 font-display text-base font-semibold text-primary">{o.name}</h3>
                {(o.brand || o.model) && (
                  <p className="mt-0.5 text-xs text-secondary">
                    {o.brand}{o.brand && o.model ? " · " : ""}{o.model}
                  </p>
                )}
                <p className="mt-3 text-xs text-secondary">
                  {o.room?.name ?? "Unknown room"}
                  {o.location?.observed_at ? ` · last seen ${formatRelativeTime(o.location.observed_at)}` : ""}
                </p>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
