import Link from "next/link";
import { Building2, ArrowRight } from "lucide-react";
import { listUserHomes } from "@/lib/server/data";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/feedback";
import { CreateHomeDialog } from "@/components/home/create-home-dialog";
import { DemoSetupButton } from "@/components/home/demo-setup-button";
import { formatRelativeTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function HomesPage() {
  const homes = await listUserHomes();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-primary">My homes</h1>
          <p className="mt-1 text-sm text-secondary">Each home is its own spatial memory.</p>
        </div>
        <CreateHomeDialog />
      </div>

      {homes.length === 0 ? (
        <div className="space-y-6">
          <Card>
            <EmptyState
              icon={<Building2 className="h-5 w-5" />}
              title="No homes yet"
              description="Create a home to start scanning rooms and building your inventory."
              action={<CreateHomeDialog />}
            />
          </Card>
          <div className="flex justify-center">
            <DemoSetupButton label="Load a sample home" />
          </div>
        </div>
      ) : (
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
                  {h.last_scan_at ? ` · scanned ${formatRelativeTime(h.last_scan_at)}` : ""}
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
