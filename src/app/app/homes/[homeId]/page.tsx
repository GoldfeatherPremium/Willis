import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Building2 } from "lucide-react";
import { requireApiHomeAccess } from "@/lib/api-helpers";
import { getHomeDetail } from "@/lib/server/data";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/feedback";
import { CreateHomeDialog } from "@/components/home/create-home-dialog";
import { formatRelativeTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function HomeDetailPage({ params }: { params: Promise<{ homeId: string }> }) {
  const { homeId } = await params;
  const access = await requireApiHomeAccess(homeId);
  const detail = await getHomeDetail(homeId);
  if (!detail) notFound();

  const { home, rooms, objects, scans, recentEvents } = detail;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-accent" />
            {home.is_demo && <Badge tone="warm">Demo</Badge>}
            {access.role && <Badge tone="muted">{access.role}</Badge>}
          </div>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-primary">{home.name}</h1>
          {home.address && <p className="mt-1 text-sm text-secondary">{home.address}</p>}
        </div>
        <Link href={`/app/homes/${homeId}/rooms`}>
          <Button>Scan a room</Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="p-5"><Stat label="Rooms" value={rooms.length} /></Card>
        <Card className="p-5"><Stat label="Belongings" value={objects.length} /></Card>
        <Card className="p-5"><Stat label="Scans" value={scans.length} /></Card>
        <Card className="p-5">
          <p className="tnum font-display text-3xl font-bold text-primary">
            {scans[0] ? formatRelativeTime(scans[0]!.created_at) : "—"}
          </p>
          <p className="mt-1 text-sm text-secondary">Last scan</p>
        </Card>
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-primary">Rooms</h2>
          <Link href={`/app/homes/${homeId}/rooms`} className="flex items-center gap-1 text-sm font-medium text-accent hover:underline">
            Manage <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        {rooms.length === 0 ? (
          <Card>
            <EmptyState
              icon={<Building2 className="h-5 w-5" />}
              title="No rooms yet"
              description="Add your first room to start scanning."
              action={<Link href={`/app/homes/${homeId}/rooms`}><Button variant="secondary">Add a room</Button></Link>}
            />
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rooms.map((r) => (
              <Link key={r.id} href={`/app/homes/${homeId}/rooms/${r.id}`}>
                <Card className="h-full p-5 transition-all hover:-translate-y-0.5 hover:border-accent/30">
                  <h3 className="font-display text-base font-semibold text-primary">{r.name}</h3>
                  <p className="mt-1 text-xs text-secondary">{r.room_type.replace("_", " ")} · floor {r.floor}</p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-accent">
                    Open room <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      {recentEvents.length > 0 && (
        <div>
          <h2 className="mb-4 font-display text-lg font-semibold text-primary">Recent activity</h2>
          <Card className="divide-y divide-border">
            {recentEvents.map((ev) => (
              <div key={ev.id} className="flex items-center justify-between gap-3 px-5 py-3">
                <div>
                  <p className="text-sm text-primary">{eventLabel(ev.type)}</p>
                  {ev.payload?.name && <p className="text-xs text-secondary">{String(ev.payload.name)}</p>}
                </div>
                <span className="shrink-0 text-xs text-secondary">{formatRelativeTime(ev.created_at)}</span>
              </div>
            ))}
          </Card>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="tnum font-display text-3xl font-bold text-primary">{value}</p>
      <p className="mt-1 text-sm text-secondary">{label}</p>
    </div>
  );
}

function eventLabel(type: string): string {
  const map: Record<string, string> = {
    home_created: "Home created",
    room_created: "Room added",
    scan_started: "Scan started",
    scan_completed: "Scan completed",
    scan_failed: "Scan failed",
    object_created: "Object discovered",
    object_updated: "Object updated",
    object_verified: "Object verified",
    object_location_changed: "Location changed",
    report_generated: "Report generated",
    member_added: "Family member added",
    subscription_changed: "Plan changed"
  };
  return map[type] ?? type;
}
