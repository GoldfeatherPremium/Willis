"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/feedback";

const Scene = dynamic(() => import("./scene"), { ssr: false, loading: () => <Skeleton className="h-full w-full" /> });

export interface ViewerObject {
  id: string;
  name: string;
  category: string;
  x?: number;
  z?: number;
}

export function Viewer({
  width,
  length,
  height,
  objects,
  simulated,
  roomName
}: {
  width: number;
  length: number;
  height: number;
  objects: ViewerObject[];
  simulated: boolean;
  roomName: string;
}) {
  const [failed, setFailed] = React.useState(false);

  if (failed) {
    return (
      <div className="flex h-80 items-center justify-center rounded-card border border-border bg-bg-secondary/50 p-6 text-center">
        <div>
          <p className="font-display text-sm font-semibold text-primary">3D viewer unavailable</p>
          <p className="mt-1 text-sm text-secondary">Your device or browser may not support WebGL. Use the room inventory instead.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-80 w-full overflow-hidden rounded-card border border-border bg-[#0b0e11]">
      <Scene
        width={width}
        length={length}
        height={height}
        objects={objects}
        onError={() => setFailed(true)}
      />
      <div className="pointer-events-none absolute left-3 top-3 flex items-center gap-2">
        <Badge tone="default">{roomName}</Badge>
        {simulated && (
          <Badge tone="warm">
            <Sparkles className="h-3 w-3" /> Simulated scene
          </Badge>
        )}
      </div>
      <p className="pointer-events-none absolute bottom-3 left-3 rounded-lg bg-black/50 px-2.5 py-1 text-xs text-secondary backdrop-blur-sm">
        Drag to orbit · scroll to zoom · tap a glowing marker for details
      </p>
    </div>
  );
}
