"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { HOME_TYPES, ROOM_TYPES } from "@/lib/types/constants";

const HOME_TYPE_LABELS: Record<(typeof HOME_TYPES)[number], string> = {
  house: "House",
  apartment: "Apartment",
  studio: "Studio",
  loft: "Loft",
  townhouse: "Townhouse",
  other: "Other"
};

const ROOM_TYPE_LABELS: Record<(typeof ROOM_TYPES)[number], string> = {
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

const STEPS = ["Create home", "First room", "Scan tutorial"];

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = React.useState(0);
  const [homeName, setHomeName] = React.useState("");
  const [homeType, setHomeType] = React.useState<(typeof HOME_TYPES)[number]>("house");
  const [roomName, setRoomName] = React.useState("");
  const [roomType, setRoomType] = React.useState<(typeof ROOM_TYPES)[number]>("living_room");
  const [homeId, setHomeId] = React.useState<string | null>(null);
  const [roomId, setRoomId] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function createHome(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/homes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: homeName, homeType })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message ?? "Could not create home.");
      setHomeId(json.data.home.id);
      setStep(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function createRoom(e: React.FormEvent) {
    e.preventDefault();
    if (!homeId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ homeId, name: roomName, roomType })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message ?? "Could not create room.");
      setRoomId(json.data.room.id);
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center gap-2">
        {STEPS.map((label, i) => (
          <div key={label} className="flex flex-1 items-center gap-2">
            <div className={"flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold " + (i <= step ? "bg-accent text-bg" : "bg-surface text-secondary")}>
              {i + 1}
            </div>
            <span className={"hidden text-sm sm:block " + (i <= step ? "text-primary" : "text-secondary")}>{label}</span>
            {i < STEPS.length - 1 && <div className="h-px flex-1 bg-border" />}
          </div>
        ))}
      </div>

      <div className="mt-10 rounded-card border bg-surface/60 p-8">
        {step === 0 && (
          <>
            <h1 className="font-display text-2xl font-bold text-primary">Create your home</h1>
            <p className="mt-1 text-sm text-secondary">This is the space you'll reconstruct and remember.</p>
            <form onSubmit={createHome} className="mt-6 space-y-4">
              {error && <div className="rounded-xl border border-error/25 bg-error/10 px-3.5 py-2.5 text-sm text-error">{error}</div>}
              <Input placeholder="Home name" value={homeName} onChange={(e) => setHomeName(e.target.value)} required />
              <div className="flex flex-wrap gap-2">
                {HOME_TYPES.map((t) => (
                  <button key={t} type="button" onClick={() => setHomeType(t)}
                    className={"rounded-full border px-3 py-1.5 text-sm font-medium " + (homeType === t ? "border-accent/50 bg-accent-soft text-accent" : "border-border bg-surface text-secondary hover:text-primary")}>
                    {HOME_TYPE_LABELS[t]}
                  </button>
                ))}
              </div>
              <div className="flex justify-end"><Button type="submit" loading={loading}>Continue</Button></div>
            </form>
          </>
        )}

        {step === 1 && (
          <>
            <h1 className="font-display text-2xl font-bold text-primary">Add your first room</h1>
            <p className="mt-1 text-sm text-secondary">You only need one room to start experiencing HomeAtlas.</p>
            <form onSubmit={createRoom} className="mt-6 space-y-4">
              {error && <div className="rounded-xl border border-error/25 bg-error/10 px-3.5 py-2.5 text-sm text-error">{error}</div>}
              <Input placeholder="Room name" value={roomName} onChange={(e) => setRoomName(e.target.value)} required />
              <div className="flex flex-wrap gap-2">
                {ROOM_TYPES.map((t) => (
                  <button key={t} type="button" onClick={() => setRoomType(t)}
                    className={"rounded-full border px-3 py-1.5 text-sm font-medium " + (roomType === t ? "border-accent/50 bg-accent-soft text-accent" : "border-border bg-surface text-secondary hover:text-primary")}>
                    {ROOM_TYPE_LABELS[t]}
                  </button>
                ))}
              </div>
              <div className="flex justify-between">
                <Button type="button" variant="ghost" onClick={() => setStep(0)}>Back</Button>
                <Button type="submit" loading={loading}>Continue</Button>
              </div>
            </form>
          </>
        )}

        {step === 2 && homeId && roomId && (
          <div className="text-center">
            <h1 className="font-display text-2xl font-bold text-primary">You're all set</h1>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-secondary">
              Open your room to walk through the scanning tutorial, then upload a
              few photos or a short video. AI reconstructs the space and suggests
              the belongings it finds.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3">
              <Link href={`/app/homes/${homeId}/rooms/${roomId}`}>
                <Button size="lg">Open {roomName || "your room"}</Button>
              </Link>
              <Link href={`/app/homes/${homeId}`} className="text-sm text-secondary hover:text-primary">
                Skip for now — go to home overview
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
