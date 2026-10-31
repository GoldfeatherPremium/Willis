"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { HOME_TYPES } from "@/lib/types/constants";

const HOME_TYPE_LABELS: Record<(typeof HOME_TYPES)[number], string> = {
  house: "House",
  apartment: "Apartment",
  studio: "Studio",
  loft: "Loft",
  townhouse: "Townhouse",
  other: "Other"
};

export function CreateHomeDialog({ children }: { children?: React.ReactNode }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [homeType, setHomeType] = React.useState<(typeof HOME_TYPES)[number]>("house");
  const [address, setAddress] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/homes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, homeType, address: address || null })
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error?.message ?? "Could not create home.");
      }
      setOpen(false);
      setName("");
      setAddress("");
      router.push(`/app/homes/${json.data.home.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <span onClick={() => setOpen(true)}>
        {children ?? (
          <Button>
            <Plus className="h-4 w-4" /> Create a home
          </Button>
        )}
      </span>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a home</DialogTitle>
          <DialogDescription>Give your space a name to get started.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="mt-4 space-y-4">
          {error && (
            <div className="rounded-xl border border-error/25 bg-error/10 px-3.5 py-2.5 text-sm text-error">
              {error}
            </div>
          )}
          <Input
            placeholder="Home name (e.g. Sunset Apartment)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            minLength={1}
          />
          <div className="flex flex-wrap gap-2">
            {HOME_TYPES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setHomeType(t)}
                className={
                  "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors " +
                  (homeType === t
                    ? "border-accent/50 bg-accent-soft text-accent"
                    : "border-border bg-surface text-secondary hover:text-primary")
                }
              >
                {HOME_TYPE_LABELS[t]}
              </button>
            ))}
          </div>
          <Input
            placeholder="Address (optional)"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" loading={loading}>Create</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
