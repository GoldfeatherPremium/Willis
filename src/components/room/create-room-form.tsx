"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ROOM_TYPES } from "@/lib/types/constants";

const LABELS: Record<(typeof ROOM_TYPES)[number], string> = {
  living_room: "Living room",
  kitchen: "Kitchen",
  bedroom: "Bedroom",
  bathroom: "Bathroom",
  study: "Study",
  storage: "Storage",
  hallway: "Hallway",
  garage: "Garage",
  balcony: "Balcony",
  other: "Other"
};

export function CreateRoomForm({ homeId }: { homeId: string }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [roomType, setRoomType] = React.useState<(typeof ROOM_TYPES)[number]>("living_room");
  const [width, setWidth] = React.useState("4");
  const [length, setLength] = React.useState("5");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          homeId,
          name,
          roomType,
          width: Number(width),
          length: Number(length),
          height: 2.7
        })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message ?? "Could not create room.");
      setOpen(false);
      setName("");
      router.push(`/app/homes/${homeId}/rooms/${json.data.room.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" /> Add room
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a room</DialogTitle>
          <DialogDescription>Rooms are the containers for your scans and belongings.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="mt-4 space-y-4">
          {error && <div className="rounded-xl border border-error/25 bg-error/10 px-3.5 py-2.5 text-sm text-error">{error}</div>}
          <Input placeholder="Room name" value={name} onChange={(e) => setName(e.target.value)} required />
          <div className="flex flex-wrap gap-2">
            {ROOM_TYPES.map((t) => (
              <button key={t} type="button" onClick={() => setRoomType(t)}
                className={"rounded-full border px-3 py-1.5 text-sm font-medium " + (roomType === t ? "border-accent/50 bg-accent-soft text-accent" : "border-border bg-surface text-secondary hover:text-primary")}>
                {LABELS[t]}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1 block text-xs text-secondary">Width (m)</span>
              <Input type="number" min="1" max="50" value={width} onChange={(e) => setWidth(e.target.value)} required />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-secondary">Length (m)</span>
              <Input type="number" min="1" max="50" value={length} onChange={(e) => setLength(e.target.value)} required />
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" loading={loading}>Create room</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
