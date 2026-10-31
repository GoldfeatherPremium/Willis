"use client";

import * as React from "react";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface HomeWithMembers {
  home_id: string;
  name: string;
  role: string;
  members: { id: string; full_name: string | null; email: string | null; role: string }[];
}

function MemberRow({ m }: { m: HomeWithMembers["members"][number] }) {
  return (
    <li className="flex items-center justify-between gap-3 py-2.5">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full border bg-bg-secondary text-xs font-semibold text-secondary">
          {(m.full_name ?? m.email ?? "U").slice(0, 2).toUpperCase()}
        </div>
        <div>
          <p className="text-sm font-medium text-primary">{m.full_name ?? "Member"}</p>
          <p className="text-xs text-secondary">{m.email}</p>
        </div>
      </div>
      <Badge tone="muted">{m.role}</Badge>
    </li>
  );
}

export function FamilyManager({ homes }: { homes: HomeWithMembers[] }) {
  const [email, setEmail] = React.useState<Record<string, string>>({});
  const [state, setState] = React.useState<Record<string, "idle" | "busy" | "done" | "error">>({});
  const [message, setMessage] = React.useState<Record<string, string>>({});

  async function add(homeId: string) {
    setState((s) => ({ ...s, [homeId]: "busy" }));
    setMessage((m) => ({ ...m, [homeId]: "" }));
    try {
      const res = await fetch(`/api/v1/homes/${homeId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email[homeId] ?? "" })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message ?? "Could not add member.");
      setState((s) => ({ ...s, [homeId]: "done" }));
      setMessage((m) => ({ ...m, [homeId]: "Added!" }));
      setEmail((e) => ({ ...e, [homeId]: "" }));
    } catch (err) {
      setState((s) => ({ ...s, [homeId]: "error" }));
      setMessage((m) => ({ ...m, [homeId]: err instanceof Error ? err.message : "Failed." }));
    }
  }

  return (
    <div className="space-y-6">
      {homes.map((h) => (
        <Card key={h.home_id} className="p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-base font-semibold text-primary">{h.name}</h3>
            <Badge tone="muted">{h.role}</Badge>
          </div>

          <ul className="mt-3 divide-y divide-border">
            {h.members.map((m) => (
              <MemberRow key={m.id} m={m} />
            ))}
          </ul>

          <div className="mt-4 flex items-center gap-2 border-t border-border pt-4">
            <Input
              placeholder="Invite by email"
              type="email"
              value={email[h.home_id] ?? ""}
              onChange={(e) => setEmail((x) => ({ ...x, [h.home_id]: e.target.value }))}
              className="max-w-xs"
            />
            <Button size="sm" onClick={() => add(h.home_id)} loading={state[h.home_id] === "busy"}>
              <UserPlus className="h-3.5 w-3.5" /> Invite
            </Button>
          </div>
          {message[h.home_id] && (
            <p className={"mt-2 text-xs " + (state[h.home_id] === "error" ? "text-error" : "text-success")}>
              {message[h.home_id]}
            </p>
          )}
        </Card>
      ))}
    </div>
  );
}
