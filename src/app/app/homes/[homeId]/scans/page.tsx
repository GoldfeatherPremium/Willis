import Link from "next/link";
import { ScanLine } from "lucide-react";
import { notFound } from "next/navigation";
import { requireApiHomeAccess } from "@/lib/api-helpers";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/feedback";
import { ScanRetryButton } from "@/components/scan/scan-retry-button";
import { formatRelativeTime, formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

const STATUS_TONE: Record<string, "default" | "accent" | "success" | "error" | "warm"> = {
  completed: "success",
  processing: "accent",
  validated: "accent",
  pending: "default",
  failed: "error",
  canceled: "muted"
};

export default async function ScansPage({ params }: { params: Promise<{ homeId: string }> }) {
  const { homeId } = await params;
  await requireApiHomeAccess(homeId);

  const supabase = await createClient();
  const { data: scans } = await supabase
    .from("scans")
    .select("id, status, capture_type, is_simulated, quality_score, error, created_at, completed_at, room_id, room:rooms(name)")
    .eq("home_id", homeId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (!scans) notFound();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-primary">Scans</h1>
          <p className="mt-1 text-sm text-secondary">Every capture and reconstruction in this home.</p>
        </div>
        <Link href={`/app/homes/${homeId}/rooms`}><Button>New scan</Button></Link>
      </div>

      {scans.length === 0 ? (
        <Card>
          <EmptyState
            icon={<ScanLine className="h-5 w-5" />}
            title="No scans yet"
            description="Open a room and capture your first photos or video."
            action={<Link href={`/app/homes/${homeId}/rooms`}><Button>Go to rooms</Button></Link>}
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {scans.map((s) => (
            <Card key={s.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border bg-bg-secondary text-accent">
                  <ScanLine className="h-4.5 w-4.5" style={{ width: 18, height: 18 }} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-display text-sm font-semibold text-primary">{s.room?.name ?? "Room"}</p>
                    <Badge tone={STATUS_TONE[s.status]}>{s.status}</Badge>
                    {s.is_simulated && <Badge tone="warm">Simulated</Badge>}
                  </div>
                  <p className="mt-0.5 text-xs text-secondary">
                    {s.capture_type} · {formatDateTime(s.created_at)}
                    {s.quality_score != null && ` · quality ${Math.round(s.quality_score)}`}
                  </p>
                  {s.error && <p className="mt-1 text-xs text-error">{s.error}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="hidden text-xs text-secondary sm:block">
                  {s.completed_at ? `Completed ${formatRelativeTime(s.completed_at)}` : s.status}
                </span>
                {s.status === "failed" && <ScanRetryButton scanId={s.id} />}
                <Link href={`/app/homes/${homeId}/rooms/${s.room_id}`}>
                  <Button variant="secondary" size="sm">Open room</Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
