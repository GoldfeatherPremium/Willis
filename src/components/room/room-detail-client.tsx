"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, X } from "lucide-react";
import { Viewer, type ViewerObject } from "@/components/three/viewer";
import { CaptureFlow } from "@/components/room/capture-flow";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface RoomDetailClientProps {
  room: {
    id: string;
    home_id: string;
    name: string;
    width: number;
    length: number;
    height: number;
  };
  objects: {
    id: string;
    name: string;
    category: string;
    is_demo: boolean;
    ai_extracted: unknown;
  }[];
  simulated: boolean;
}

export function RoomDetailClient({ room, objects, simulated }: RoomDetailClientProps) {
  const [selected, setSelected] = React.useState<ViewerObject | null>(null);

  const viewerObjects: ViewerObject[] = objects.map((o) => ({ id: o.id, name: o.name, category: o.category }));

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div className="space-y-6">
        <Viewer
          width={room.width}
          length={room.length}
          height={room.height}
          objects={viewerObjects}
          simulated={simulated}
          roomName={room.name}
        />

        {selected && (
          <Card className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Badge tone="accent">{selected.category}</Badge>
                  {simulated && <Badge tone="warm">Simulated</Badge>}
                </div>
                <h3 className="mt-2 font-display text-lg font-semibold text-primary">{selected.name}</h3>
              </div>
              <button onClick={() => setSelected(null)} className="rounded-lg p-1.5 text-secondary hover:bg-bg-secondary hover:text-primary" aria-label="Close">
                <X className="h-4 w-4" />
              </button>
            </div>
            <Link
              href={`/app/homes/${room.home_id}/inventory/${selected.id}`}
              className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline"
            >
              Open object details <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Card>
        )}

        <CaptureFlow roomId={room.id} homeId={room.home_id} isSimulatedProvider={simulated} />
      </div>

      <div className="space-y-6">
        <Card className="p-5">
          <h3 className="font-display text-sm font-semibold text-primary">Objects in this room ({objects.length})</h3>
          {objects.length === 0 ? (
            <p className="mt-3 text-sm text-secondary">
              No objects yet. Run a scan to let AI discover them.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-border">
              {objects.slice(0, 12).map((o) => (
                <li key={o.id}>
                  <Link
                    href={`/app/homes/${room.home_id}/inventory/${o.id}`}
                    className="flex items-center justify-between gap-2 py-2.5 text-sm text-primary transition-colors hover:text-accent"
                  >
                    <span className="truncate">{o.name}</span>
                    <Badge tone="muted">{o.category}</Badge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
