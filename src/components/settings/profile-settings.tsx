"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

export function ProfileSettings({
  email,
  initialName
}: {
  email: string | null;
  initialName: string;
}) {
  const router = useRouter();
  const [name, setName] = React.useState(initialName);
  const [saving, setSaving] = React.useState(false);
  const [message, setMessage] = React.useState<{ kind: "ok" | "error"; text: string } | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/v1/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName: name })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message ?? "Could not save profile.");
      setMessage({ kind: "ok", text: "Saved." });
      router.refresh();
    } catch (err) {
      setMessage({ kind: "error", text: err instanceof Error ? err.message : "Something went wrong." });
    } finally {
      setSaving(false);
    }
  }

  async function deleteAccount() {
    if (!window.confirm("Delete your account and all data? This cannot be undone.")) return;
    const res = await fetch("/api/v1/account/delete", { method: "POST" });
    if (res.ok) {
      router.push("/");
      router.refresh();
    }
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="font-display text-base font-semibold text-primary">Profile</h3>
        {message && (
          <div className={"mt-4 rounded-xl border px-3.5 py-2.5 text-sm " + (message.kind === "ok" ? "border-success/25 bg-success/10 text-success" : "border-error/25 bg-error/10 text-error")}>
            {message.text}
          </div>
        )}
        <form onSubmit={save} className="mt-4 space-y-4">
          <label className="block">
            <span className="mb-1 block text-xs text-secondary">Full name</span>
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-secondary">Email</span>
            <Input value={email ?? ""} disabled />
          </label>
          <Button type="submit" loading={saving}>Save profile</Button>
        </form>
      </Card>

      <Card className="border-error/20 p-6">
        <h3 className="font-display text-base font-semibold text-error">Danger zone</h3>
        <p className="mt-1 text-sm text-secondary">
          Permanently delete your account and all stored data, including scans,
          objects, documents, and exports.
        </p>
        <Button variant="danger" className="mt-4" onClick={deleteAccount}>
          Delete account
        </Button>
      </Card>
    </div>
  );
}
