import Link from "next/link";
import { Building2, Sparkles, ScanLine, ArrowRight } from "lucide-react";
import { listUserHomes } from "@/lib/server/data";
import { EmptyState } from "@/components/ui/feedback";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreateHomeDialog } from "@/components/home/create-home-dialog";
import { DemoSetupButton } from "@/components/home/demo-setup-button";
import { formatRelativeTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const homes = await listUserHomes();

  if (homes.length === 0) {
    return (
      <div className="flex flex-col items-center gap-8">
        <div className="text-center pt-16">
          <p className="text-sm font-medium text-accent">Your world, reconstructed.</p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-primary sm:text-4xl">
            Welcome to HomeAtlas
          </h1>
          <p className="mx-auto mt-3 max-w-md text-secondary">
            Create a home, scan your first room, and start remembering where
            everything lives.
          </p>
        </div>
        <EmptyState
          icon={<Building2 className="h-5 w-5" />}
          title="No homes yet"
          description="Create your first home to start scanning rooms and building your inventory."
          action={<CreateHomeDialog />}
        />
        <DemoSetupButton label="Load a sample home" />
      </div>
    );
  }

  const totalObjects = homes.reduce((s, h) => s + h.object_count, 0);
  const totalRooms = homes.reduce((s, h) => s + h.room_count, 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-primary sm:text-3xl">Overview</h1>
          <p className="mt-1 text-sm text-secondary">Everything you've reconstructed in one place.</p>
        </div>
        <CreateHomeDialog />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="p-5"><Stat label="Homes" value={homes.length} /></Card>
        <Card className="p-5"><Stat label="Rooms" value={totalRooms} /></Card>
        <Card className="p-5"><Stat label="Belongings" value={totalObjects} /></Card>
        <Link href="/app/assistant">
          <Card className="p-5 transition-colors hover:bg-surface-hover">
            <div className="flex items-center gap-2 text-sm text-accent">
              <Sparkles className="h-4 w-4" /> Ask AI
            </div>
            <p className="mt-2 text-sm text-secondary">“Where is my camera battery?”</p>
          </Card>
        </Link>
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-primary">Your homes</h2>
          <Link href="/app/homes" className="flex items-center gap-1 text-sm font-medium text-accent hover:underline">
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {homes.map((h) => (
            <Link key={h.home_id} href={`/app/homes/${h.home_id}`}>
              <Card className="h-full p-5 transition-all hover:-translate-y-0.5 hover:border-accent/30">
                <div className="flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border bg-bg-secondary text-accent">
                    <Building2 className="h-5 w-5" />
                  </div>
                  {h.is_demo && <Badge tone="warm">Demo</Badge>}
                </div>
                <h3 className="mt-4 font-display text-base font-semibold text-primary">{h.name}</h3>
                <p className="mt-1 text-xs text-secondary">
                  {h.room_count} rooms · {h.object_count} objects
                  {h.last_scan_at ? ` · scanned ${formatRelativeTime(h.last_scan_at)}` : " · not scanned yet"}
                </p>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {homes.some((h) => h.room_count === 0) && (
        <Card className="flex flex-wrap items-center justify-between gap-4 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border bg-accent-soft text-accent">
              <ScanLine className="h-5 w-5" />
            </div>
            <div>
              <p className="font-display text-sm font-semibold text-primary">Ready to scan a room?</p>
              <p className="text-sm text-secondary">Add a room, then capture photos or a short video.</p>
            </div>
          </div>
          <Link href={`/app/homes/${homes[0]!.home_id}/rooms`}>
            <Button variant="secondary">Add your first room</Button>
          </Link>
        </Card>
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
