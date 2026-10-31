import Link from "next/link";
import { PackageSearch } from "lucide-react";
import { requireApiHomeAccess } from "@/lib/api-helpers";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/feedback";
import { InventoryGrid } from "@/components/object/inventory-grid";

export const dynamic = "force-dynamic";

export default async function InventoryPage({ params }: { params: Promise<{ homeId: string }> }) {
  const { homeId } = await params;
  await requireApiHomeAccess(homeId);

  const supabase = await createClient();
  const { data: objects } = await supabase
    .from("objects")
    .select(
      `id, name, category, description, brand, model, thumbnail_url, is_demo, ai_extracted, created_at,
       room:rooms(id, name),
       location:object_locations!object_locations_object_id_fkey(id, room_id, observed_at, confidence, verification_status)`
    )
    .eq("home_id", homeId)
    .is("archived_at", null)
    .eq("location.is_current", true)
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-primary">Inventory</h1>
        <p className="mt-1 text-sm text-secondary">Everything AI found and you confirmed.</p>
      </div>

      {(objects ?? []).length === 0 ? (
        <Card>
          <EmptyState
            icon={<PackageSearch className="h-5 w-5" />}
            title="No objects yet"
            description="Scan a room and HomeAtlas will suggest the belongings it finds. You confirm what's real."
            action={<Link href={`/app/homes/${homeId}/rooms`}><Button>Go to rooms</Button></Link>}
          />
        </Card>
      ) : (
        <InventoryGrid homeId={homeId} objects={objects ?? []} />
      )}
    </div>
  );
}
