import { createAdminClient } from "@/lib/supabase/server";

/**
 * Generates an insurance inventory report (CSV) for a home and saves it to the
 * private `exports` storage bucket. Returns the storage path.
 */
export async function generateInsuranceReport(homeId: string): Promise<{ storagePath: string; filename: string }> {
  const admin = await createAdminClient();

  const { data: home } = await admin.from("homes").select("name, owner_id").eq("id", homeId).single();
  if (!home) throw new Error("Home not found");

  const { data: objects } = await admin
    .from("objects")
    .select(
      `id, name, category, brand, model, serial_number, description, value_cents, created_at,
       room:rooms(name),
       location:object_locations!object_locations_object_id_fkey(room_id, observed_at, confidence, verification_status)`
    )
    .eq("home_id", homeId)
    .is("archived_at", null)
    .eq("location.is_current", true)
    .order("name");

  const header = "name,category,brand,model,serial_number,value_usd,room,last_observed,confidence,description";
  const rows = (objects ?? []).map((o: any) => {
    const val = o.value_cents != null ? (o.value_cents / 100).toFixed(2) : "";
    const room = o.room?.name ?? o.location?.room_id ?? "";
    const last = o.location?.observed_at ?? "";
    const conf = o.location?.confidence ?? "";
    const esc = (v: unknown) => {
      const s = String(v ?? "").replace(/"/g, '""');
      return /[",\n]/.test(s) ? `"${s}"` : s;
    };
    return [esc(o.name), esc(o.category), esc(o.brand), esc(o.model), esc(o.serial_number), esc(val), esc(room), esc(last), esc(conf), esc(o.description)].join(",");
  });

  const csv = [header, ...rows].join("\n");
  const filename = `insurance-inventory-${homeId.slice(0, 8)}.csv`;
  const storagePath = `${home.owner_id}/reports/${filename}`;

  const { error } = await admin.storage.from("exports").upload(storagePath, csv, {
    contentType: "text/csv",
    upsert: true
  });
  if (error) throw new Error(`Could not store report: ${error.message}`);

  return { storagePath, filename };
}
