import { createClient } from "@/lib/supabase/server";

/** Lists the current user's homes (via the RLS-scoped view). */
export async function listUserHomes() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_homes")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getHomeDetail(homeId: string) {
  const supabase = await createClient();
  const { data: home } = await supabase.from("homes").select("*").eq("id", homeId).maybeSingle();
  if (!home) return null;

  const [rooms, objects, scans, recentEvents] = await Promise.all([
    supabase
      .from("rooms")
      .select("id, name, room_type, floor, width, length, height, thumbnail_url, is_demo")
      .eq("home_id", homeId)
      .is("archived_at", null)
      .order("created_at", { ascending: true }),
    supabase
      .from("objects")
      .select("id, name, category, brand, model, thumbnail_url, is_demo")
      .eq("home_id", homeId)
      .is("archived_at", null)
      .order("created_at", { ascending: false })
      .limit(6),
    supabase
      .from("scans")
      .select("id, status, capture_type, is_simulated, quality_score, created_at, completed_at, room_id, room:rooms(name)")
      .eq("home_id", homeId)
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("activity_events")
      .select("id, type, payload, created_at")
      .eq("home_id", homeId)
      .order("created_at", { ascending: false })
      .limit(8)
  ]);

  return {
    home,
    rooms: rooms.data ?? [],
    objects: objects.data ?? [],
    scans: scans.data ?? [],
    recentEvents: recentEvents.data ?? []
  };
}

export async function getRoomDetail(roomId: string) {
  const supabase = await createClient();
  const { data: room } = await supabase
    .from("rooms")
    .select("*, home: homes(id, name)")
    .eq("id", roomId)
    .maybeSingle();
  if (!room) return null;

  const [objects, scans, jobs] = await Promise.all([
    supabase
      .from("objects")
      .select("id, name, category, brand, model, thumbnail_url, is_demo, ai_extracted")
      .eq("room_id", roomId)
      .is("archived_at", null)
      .order("created_at", { ascending: false }),
    supabase
      .from("scans")
      .select("id, status, capture_type, is_simulated, quality_score, error, created_at, completed_at")
      .eq("room_id", roomId)
      .order("created_at", { ascending: false }),
    supabase
      .from("reconstruction_jobs")
      .select("id, status, progress, error, result_type, result_uri, completed_at, created_at")
      .eq("room_id", roomId)
      .order("created_at", { ascending: false })
      .limit(1)
  ]);

  return { room, objects: objects.data ?? [], scans: scans.data ?? [], job: jobs.data?.[0] ?? null };
}
