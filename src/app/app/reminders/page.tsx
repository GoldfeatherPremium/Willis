import { Bell } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/feedback";
import { formatRelativeTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function RemindersPage() {
  await requireUser();
  const supabase = await createClient();
  const { data: notifications } = await supabase
    .from("notifications")
    .select("id, type, title, body, link, read_at, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-primary">Reminders</h1>
        <p className="mt-1 text-sm text-secondary">Notifications about scans, discoveries, and your account.</p>
      </div>

      {(notifications ?? []).length === 0 ? (
        <Card>
          <EmptyState icon={<Bell className="h-5 w-5" />} title="All caught up" description="Notifications will appear here when scans finish or something needs your attention." />
        </Card>
      ) : (
        <Card className="divide-y divide-border">
          {(notifications ?? []).map((n) => (
            <div key={n.id} className="flex items-start justify-between gap-3 px-5 py-3.5">
              <div>
                <div className="flex items-center gap-2">
                  <Badge tone={n.read_at ? "muted" : "accent"}>{n.type.replace("_", " ")}</Badge>
                  {!n.read_at && <span className="h-1.5 w-1.5 rounded-full bg-accent" />}
                </div>
                <p className="mt-1.5 text-sm font-medium text-primary">{n.title}</p>
                {n.body && <p className="mt-0.5 text-sm text-secondary">{n.body}</p>}
              </div>
              <span className="shrink-0 text-xs text-secondary">{formatRelativeTime(n.created_at)}</span>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
