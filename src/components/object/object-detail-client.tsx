"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Upload, FileText, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatRelativeTime, formatDateTime } from "@/lib/utils";
import { OBJECT_CATEGORIES } from "@/lib/types/constants";

interface ObjectDetailData {
  id: string;
  home_id: string;
  name: string;
  category: string;
  description: string | null;
  brand: string | null;
  model: string | null;
  serial_number: string | null;
  condition: string | null;
  value_cents: number | null;
  ai_extracted: unknown;
  is_demo: boolean;
  room: { id: string; name: string } | null;
  location: {
    room_id: string | null;
    observed_at: string;
    confidence: number;
    verification_status: string;
    source: string;
  } | null;
}

export function ObjectDetailClient({
  object,
  observations,
  documents,
  rooms
}: {
  object: ObjectDetailData;
  observations: { id: string; observed_at: string; source: string; verification_status: string; room_id: string | null }[];
  documents: { id: string; kind: string; filename: string; mime_type: string | null; size_bytes: number | null; created_at: string }[];
  rooms: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [form, setForm] = React.useState({
    name: object.name,
    category: object.category,
    description: object.description ?? "",
    brand: object.brand ?? "",
    model: object.model ?? "",
    serialNumber: object.serial_number ?? "",
    condition: object.condition ?? "",
    valueCents: object.value_cents ?? "",
    roomId: object.room?.id ?? ""
  });
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [saved, setSaved] = React.useState(false);
  const [uploadDoc, setUploadDoc] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch(`/api/v1/objects/${object.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          valueCents: form.valueCents === "" ? null : Number(form.valueCents),
          roomId: form.roomId || null
        })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message ?? "Could not save.");
      setSaved(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  async function attachDocument(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadDoc(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ objectId: object.id, filename: file.name })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message ?? "Could not create upload.");
      const put = await fetch(json.data.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file
      });
      if (!put.ok) throw new Error("Upload failed.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploadDoc(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function remove() {
    if (!window.confirm(`Delete "${object.name}" from the inventory?`)) return;
    const res = await fetch(`/api/v1/objects/${object.id}`, { method: "DELETE" });
    if (res.ok) {
      router.push(`/app/homes/${object.home_id}/inventory`);
      router.refresh();
    }
  }

  const simulated = Boolean(object.ai_extracted && (object.ai_extracted as any)?.simulated);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <Card className="p-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="muted">{form.category}</Badge>
          {object.is_demo && <Badge tone="warm">Demo</Badge>}
          {simulated && <Badge tone="warm">AI-suggested (simulated)</Badge>}
          {object.location?.verification_status === "confirmed" && <Badge tone="success">Confirmed</Badge>}
          {object.location?.verification_status === "corrected" && <Badge tone="accent">Corrected</Badge>}
          {object.location?.verification_status === "unverified" && <Badge tone="default">Unverified</Badge>}
        </div>

        <form onSubmit={save} className="mt-5 space-y-4">
          {error && <div className="rounded-xl border border-error/25 bg-error/10 px-3.5 py-2.5 text-sm text-error">{error}</div>}
          {saved && <div className="rounded-xl border border-success/25 bg-success/10 px-3.5 py-2.5 text-sm text-success">Saved.</div>}

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs text-secondary">Name</span>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-secondary">Category</span>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full rounded-xl border bg-bg-secondary px-3.5 py-2.5 text-sm text-primary"
              >
                {OBJECT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-secondary">Brand</span>
              <Input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-secondary">Model</span>
              <Input value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-secondary">Serial number</span>
              <Input value={form.serialNumber} onChange={(e) => setForm({ ...form, serialNumber: e.target.value })} />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-secondary">Estimated value ($)</span>
              <Input type="number" min="0" step="0.01" value={form.valueCents} onChange={(e) => setForm({ ...form, valueCents: e.target.value })} />
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-1 block text-xs text-secondary">Room</span>
              <select
                value={form.roomId}
                onChange={(e) => setForm({ ...form, roomId: e.target.value })}
                className="w-full rounded-xl border bg-bg-secondary px-3.5 py-2.5 text-sm text-primary"
              >
                <option value="">Unknown / unassigned</option>
                {rooms.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-1 block text-xs text-secondary">Condition</span>
              <Input value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value })} placeholder="e.g. Like new, good, worn" />
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-1 block text-xs text-secondary">Notes / description</span>
              <Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </label>
          </div>

          <div className="flex items-center justify-between gap-3">
            <Button type="submit" loading={saving}>Save changes</Button>
            <Button type="button" variant="danger" onClick={remove}>
              <Trash2 className="h-4 w-4" /> Delete
            </Button>
          </div>
        </form>
      </Card>

      <div className="space-y-6">
        <Card className="p-5">
          <h3 className="font-display text-sm font-semibold text-primary">Last observed</h3>
          {object.location ? (
            <div className="mt-3 space-y-2 text-sm">
              <p className="text-primary">{object.room?.name ?? "Unknown room"}</p>
              <p className="text-xs text-secondary">
                {formatDateTime(object.location.observed_at)}
              </p>
              <p className="text-xs text-secondary">
                Source: {object.location.source} · Confidence {Math.round((object.location.confidence ?? 0) * 100)}%
              </p>
            </div>
          ) : (
            <p className="mt-3 text-sm text-secondary">No observation yet.</p>
          )}
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-sm font-semibold text-primary">Documents</h3>
            <input ref={fileRef} type="file" className="hidden" onChange={attachDocument} />
            <Button size="sm" variant="secondary" onClick={() => fileRef.current?.click()} loading={uploadDoc}>
              <Upload className="h-3.5 w-3.5" /> Attach
            </Button>
          </div>
          {documents.length === 0 ? (
            <p className="mt-3 text-sm text-secondary">No receipts, manuals, or warranties yet.</p>
          ) : (
            <ul className="mt-3 divide-y divide-border">
              {documents.map((d) => (
                <li key={d.id} className="flex items-center gap-2 py-2.5 text-sm">
                  <FileText className="h-4 w-4 shrink-0 text-accent" />
                  <span className="min-w-0 flex-1 truncate text-primary">{d.filename}</span>
                  <Badge tone="muted">{d.kind}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-5">
          <h3 className="font-display text-sm font-semibold text-primary">History</h3>
          {observations.length === 0 ? (
            <p className="mt-3 text-sm text-secondary">No observations recorded.</p>
          ) : (
            <ul className="mt-3 space-y-2.5">
              {observations.map((o) => (
                <li key={o.id} className="text-sm">
                  <p className="text-primary">{rooms.find((r) => r.id === o.room_id)?.name ?? "Unknown room"}</p>
                  <p className="text-xs text-secondary">{formatRelativeTime(o.observed_at)} · {o.source} · {o.verification_status}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
