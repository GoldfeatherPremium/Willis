import Link from "next/link";
import { ArrowRight, DoorOpen } from "lucide-react";
import { requireApiHomeAccess } from "@/lib/api-helpers";
import { listUserHomes } from "@/lib/server/data";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/feedback";
import { CreateRoomForm } from "@/components/room/create-room-form";

export const dynamic = "force-dynamic";

export default async function RoomsPage({ params }: { params: Promise<{ homeId: string }> }) {
  const { homeId } = await params;
  await requireApiHomeAccess(homeId);

  const supabase = await createClient();
  const { data: home } = await supabase.from("homes").select("name, is_demo").eq("id", homeId).maybeSingle();
  const { data: rooms } = await supabase
    .from("rooms")
    .select("id, name, room_type, floor, width, length, height, is_demo")
    .eq("home_id", homeId)
    .is("archived_at", null)
    .order("created_at", { ascending: true });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-secondary">{home?.name}</p>
          <h1 className="font-display text-2xl font-bold tracking-tight text-primary">Rooms</h1>
        </div>
        <CreateRoomForm homeId={homeId} />
      </div>

      {(rooms ?? []).length === 0 ? (
        <Card>
          <EmptyState
            icon={<DoorOpen className="h-5 w-5" />}
            title="No rooms yet"
            description="Every scan belongs to a room. Add one to get started."
            action={<CreateRoomForm homeId={homeId} />}
          />
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(rooms ?? []).map((r) => (
            <Link key={r.id} href={`/app/homes/${homeId}/rooms/${r.id}`}>
              <Card className="h-full p-5 transition-all hover:-translate-y-0.5 hover:border-accent/30">
                <h3 className="font-display text-base font-semibold text-primary">{r.name}</h3>
                <p className="mt-1 text-xs text-secondary">
                  {r.room_type.replace("_", " ")} · {r.width}m × {r.length}m
                </p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-accent">
                  Open <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
