import { History } from "lucide-react";
import { requireApiHomeAccess } from "@/lib/api-helpers";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/feedback";
import { formatRelativeTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Tone = "default" | "accent" | "success" | "error" | "warm" | "muted";

const TYPE_TONE: Record<string, Tone> = {
  scan_completed: "success",
  scan_failed: "error",
  scan_started: "accent",
  object_created: "accent",
  object_location_changed: "warm",
  home_created: "muted",
  room_created: "muted",
  object_updated: "default",
  object_verified: "success",
  report_generated: "muted",
  member_added: "muted",
  subscription_changed: "muted"
};

const TYPE_LABEL: Record<string, string> = {
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

export default async function HistoryPage({ params }: { params: Promise<{ homeId: string }> }) {
  const { homeId } = await params;
  await requireApiHomeAccess(homeId);

  const supabase = await createClient();
  const { data: events } = await supabase
    .from("activity_events")
    .select("id, type, payload, created_at")
    .eq("home_id", homeId)
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-primary">History</h1>
        <p className="mt-1 text-sm text-secondary">Everything that changed in this home.</p>
      </div>

      {(events ?? []).length === 0 ? (
        <Card>
          <EmptyState icon={<History className="h-5 w-5" />} title="No activity yet" description="Scans and discoveries will appear here." />
        </Card>
      ) : (
        <Card className="divide-y divide-border">
          {(events ?? []).map((ev) => (
            <div key={ev.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
              <div className="flex items-center gap-3">
                <Badge tone={TYPE_TONE[ev.type] ?? "default"}>{TYPE_LABEL[ev.type] ?? ev.type}</Badge>
                <div>
                  {ev.payload?.name && <p className="text-sm text-primary">{String(ev.payload.name)}</p>}
                  {ev.payload?.room_id && <p className="text-xs text-secondary">room {String(ev.payload.room_id).slice(0, 8)}</p>}
                </div>
              </div>
              <span className="shrink-0 text-xs text-secondary">{formatRelativeTime(ev.created_at)}</span>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
