import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireApiHomeAccess } from "@/lib/api-helpers";
import { getRoomDetail } from "@/lib/server/data";
import { RoomDetailClient } from "@/components/room/room-detail-client";

export const dynamic = "force-dynamic";

export default async function RoomPage({ params }: { params: Promise<{ homeId: string; roomId: string }> }) {
  const { homeId, roomId } = await params;
  const detail = await getRoomDetail(roomId);
  if (!detail) notFound();
  await requireApiHomeAccess(detail.room.home_id);

  const simulated = (process.env.RECONSTRUCTION_PROVIDER || "simulated") === "simulated";

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/app/homes/${homeId}`} className="inline-flex items-center gap-1 text-sm text-secondary hover:text-primary">
          <ArrowLeft className="h-3.5 w-3.5" /> {detail.room.home?.name ?? "Home"}
        </Link>
        <h1 className="mt-2 font-display text-2xl font-bold tracking-tight text-primary">{detail.room.name}</h1>
        <p className="mt-1 text-sm text-secondary">
          {detail.room.room_type.replace("_", " ")} · floor {detail.room.floor} ·{" "}
          {detail.room.width}m × {detail.room.length}m × {detail.room.height}m
        </p>
      </div>

      <RoomDetailClient
        room={{
          id: detail.room.id,
          home_id: detail.room.home_id,
          name: detail.room.name,
          width: Number(detail.room.width),
          length: Number(detail.room.length),
          height: Number(detail.room.height)
        }}
        objects={detail.objects}
        simulated={simulated}
      />
    </div>
  );
}
