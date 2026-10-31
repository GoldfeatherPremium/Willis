import { FolderOpen } from "lucide-react";
import { listUserHomes } from "@/lib/server/data";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/feedback";
import { ReportGenerator } from "@/components/reports/report-generator";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const homes = await listUserHomes();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-primary">Reports</h1>
        <p className="mt-1 text-sm text-secondary">Generate insurance and moving inventories from your data.</p>
      </div>

      {homes.length === 0 ? (
        <Card>
          <EmptyState icon={<FolderOpen className="h-5 w-5" />} title="No homes to report on" description="Create a home first." />
        </Card>
      ) : (
        <ReportGenerator homes={homes} />
      )}
    </div>
  );
}
