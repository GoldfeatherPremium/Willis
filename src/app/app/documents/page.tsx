import Link from "next/link";
import { FileText } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/feedback";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DocumentsPage() {
  const supabase = await createClient();
  const { data: docs } = await supabase
    .from("object_documents")
    .select("id, kind, filename, mime_type, size_bytes, created_at, object_id, object:objects(name, home_id)")
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-primary">Documents</h1>
        <p className="mt-1 text-sm text-secondary">Receipts, manuals, and warranties attached to your belongings.</p>
      </div>

      {(docs ?? []).length === 0 ? (
        <Card>
          <EmptyState
            icon={<FileText className="h-5 w-5" />}
            title="No documents yet"
            description="Open an object and attach a receipt, manual, or warranty."
          />
        </Card>
      ) : (
        <Card className="divide-y divide-border">
          {(docs ?? []).map((d: any) => (
            <div key={d.id} className="flex items-center gap-3 px-5 py-3.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border bg-bg-secondary text-accent">
                <FileText className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-primary">{d.filename}</p>
                <p className="text-xs text-secondary">
                  {d.object?.name ?? "Unknown object"}
                  {d.size_bytes ? ` · ${(d.size_bytes / 1024).toFixed(0)} KB` : ""} · {formatDate(d.created_at)}
                </p>
              </div>
              <Badge tone="muted">{d.kind}</Badge>
              {d.object?.home_id && (
                <Link href={`/app/homes/${d.object.home_id}/inventory/${d.object_id}`}>
                  <Button variant="secondary" size="sm">Open object</Button>
                </Link>
              )}
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
