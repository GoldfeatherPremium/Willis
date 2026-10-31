import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireApiHomeAccess } from "@/lib/api-helpers";
import { createClient } from "@/lib/supabase/server";
import { ObjectDetailClient } from "@/components/object/object-detail-client";

export const dynamic = "force-dynamic";

export default async function ObjectPage({ params }: { params: Promise<{ homeId: string; objectId: string }> }) {
  const { homeId, objectId } = await params;
  await requireApiHomeAccess(homeId);

  const supabase = await createClient();
  const { data: object } = await supabase
    .from("objects")
    .select(
      `id, home_id, name, category, description, brand, model, serial_number, condition, value_cents, ai_extracted, is_demo,
       room:rooms(id, name),
       location:object_locations!object_locations_object_id_fkey(id, room_id, observed_at, confidence, verification_status, source)`
    )
    .eq("id", objectId)
    .eq("home_id", homeId)
    .is("archived_at", null)
    .eq("location.is_current", true)
    .maybeSingle();

  if (!object) notFound();

  const [{ data: observations }, { data: documents }, { data: rooms }] = await Promise.all([
    supabase
      .from("object_observations")
      .select("id, room_id, observed_at, source, verification_status")
      .eq("object_id", objectId)
      .order("observed_at", { ascending: false })
      .limit(20),
    supabase
      .from("object_documents")
      .select("id, kind, filename, mime_type, size_bytes, created_at")
      .eq("object_id", objectId)
      .order("created_at", { ascending: false }),
    supabase.from("rooms").select("id, name").eq("home_id", homeId).is("archived_at", null).order("name")
  ]);

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/app/homes/${homeId}/inventory`} className="inline-flex items-center gap-1 text-sm text-secondary hover:text-primary">
          <ArrowLeft className="h-3.5 w-3.5" /> Inventory
        </Link>
        <h1 className="mt-2 font-display text-2xl font-bold tracking-tight text-primary">{object.name}</h1>
      </div>

      <ObjectDetailClient
        object={object as any}
        observations={observations ?? []}
        documents={documents ?? []}
        rooms={rooms ?? []}
      />
    </div>
  );
}
