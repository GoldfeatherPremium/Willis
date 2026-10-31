import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  withErrorHandling,
  ok,
  requireApiUser,
  requireApiHomeAccess
} from "@/lib/api-helpers";
import { getEmbeddingProvider, simulatedEmbed } from "@/lib/ai";

const searchSchema = z.object({
  homeId: z.string().uuid(),
  query: z.string().trim().min(1).max(300)
});

/**
 * Semantic + keyword search over a home's objects. The embedding source is
 * provider-agnostic (simulated adapter used when no real keys exist).
 */
export const POST = withErrorHandling(async (request) => {
  await requireApiUser();
  const body = searchSchema.parse(await request.json());
  await requireApiHomeAccess(body.homeId);

  const supabase = await createClient();
  const embeddingProvider = getEmbeddingProvider();
  const [embedding] = await embeddingProvider.embedTexts([body.query]);

  const vectorStr = `[${embedding.map((v) => v.toFixed(6)).join(",")}]`;

  // pgvector similarity via security_invoker function (RLS-scoped).
  const { data: semantic, error: semanticError } = await supabase.rpc("search_objects_semantic", {
    p_home_id: body.homeId,
    p_query_embedding: vectorStr,
    p_limit: 25
  });
  if (semanticError) throw semanticError;

  const ids = (semantic ?? []).map((r: { object_id: string }) => r.object_id);
  const objects: any[] = [];

  if (ids.length > 0) {
    const { data, error } = await supabase
      .from("objects")
      .select(
        `id, name, category, description, brand, model, thumbnail_url, ai_extracted, is_demo,
         room:rooms(id, name),
         location:object_locations!object_locations_object_id_fkey(id, room_id, observed_at, confidence, verification_status, source)`
      )
      .in("id", ids)
      .is("archived_at", null)
      .eq("location.is_current", true);
    if (error) throw error;
    objects.push(...(data ?? []));
  }

  // Keyword fallback always runs (handles zero-embedding matches).
  const term = `%${body.query.toLowerCase()}%`;
  const { data: keyword } = await supabase
    .from("objects")
    .select(
      `id, name, category, description, brand, model, thumbnail_url, ai_extracted, is_demo,
       room:rooms(id, name),
       location:object_locations!object_locations_object_id_fkey(id, room_id, observed_at, confidence, verification_status, source)`
    )
    .eq("home_id", body.homeId)
    .is("archived_at", null)
    .eq("location.is_current", true)
    .or(`name.ilike.${term},description.ilike.${term},brand.ilike.${term},model.ilike.${term},serial_number.ilike.${term}`)
    .limit(25);

  const seen = new Set<string>();
  const merged: any[] = [];
  for (const o of [...(keyword ?? []), ...objects]) {
    if (seen.has(o.id)) continue;
    seen.add(o.id);
    merged.push(o);
  }

  return ok({ query: body.query, results: merged, provider: embeddingProvider.name, simulated: embeddingProvider.isSimulated });
});
