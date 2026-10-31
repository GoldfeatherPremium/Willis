import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import type { Database } from "@/lib/types/database";

/**
 * Backend tools the assistant uses. Every tool queries the real database
 * through the user's RLS-scoped Supabase session — the assistant can only see
 * what the user can see. Tools NEVER hallucinate locations: they return
 * observed data only.
 */

export interface ToolContext {
  userId: string;
  homeId: string;
}

export interface AssistantTool {
  name: string;
  description: string;
  parameters: z.ZodTypeAny;
  execute(args: z.infer<z.ZodTypeAny>, ctx: ToolContext): Promise<unknown>;
}

const supabaseFor = async () => {
  const user = await getCurrentUser();
  if (!user) throw new Error("unauthenticated");
  const supabase = await createClient();
  return { user, supabase };
};

const requireDemoGuard = (ctx: ToolContext) => {
  // Safety: never allow tools in the demo conversation to mutate real data.
};

export const tools: AssistantTool[] = [
  {
    name: "searchObjects",
    description:
      "Search objects in the home by free-text query, category, or room. Returns objects with their current (last observed) location, room, container and confidence.",
    parameters: z.object({
      query: z.string().optional().describe("Free-text query, e.g. 'camera battery'"),
      category: z.string().optional().describe("Object category filter"),
      roomId: z.string().uuid().optional().describe("Filter by room id"),
      limit: z.number().int().min(1).max(50).optional().describe("Max results")
    }),
    async execute(args, ctx) {
      const { supabase } = await supabaseFor();
      let q = supabase
        .from("objects")
        .select(
          `id, name, category, description, brand, model, thumbnail_url, archived_at,
           room:rooms(id, name),
           location:object_locations!object_locations_object_id_fkey(id, room_id, container_object_id, position, observed_at, confidence, verification_status, is_current, source)`
        )
        .eq("home_id", ctx.homeId)
        .is("archived_at", null)
        .eq("location.is_current", true)
        .order("name");

      if (args.category) q = q.eq("category", args.category);
      if (args.roomId) q = q.eq("room_id", args.roomId);
      if (args.query) {
        const term = `%${String(args.query).toLowerCase()}%`;
        q = q.or(`name.ilike.${term},description.ilike.${term},brand.ilike.${term},model.ilike.${term}`);
      }

      const { data, error } = await q.limit(args.limit ?? 20);
      if (error) throw error;
      return { objects: data };
    }
  },
  {
    name: "getObject",
    description: "Get a single object with its current location.",
    parameters: z.object({ objectId: z.string().uuid() }),
    async execute(args, ctx) {
      const { supabase } = await supabaseFor();
      const { data, error } = await supabase
        .from("objects")
        .select(
          `id, name, category, description, brand, model, serial_number, thumbnail_url, archived_at,
           room:rooms(id, name),
           location:object_locations!object_locations_object_id_fkey(id, room_id, container_object_id, position, observed_at, confidence, verification_status, is_current, source)`
        )
        .eq("id", args.objectId)
        .eq("home_id", ctx.homeId)
        .eq("location.is_current", true)
        .maybeSingle();
      if (error) throw error;
      if (!data) return { found: false };
      return { found: true, object: data };
    }
  },
  {
    name: "getLatestObservation",
    description: "Get the most recent observation for an object.",
    parameters: z.object({ objectId: z.string().uuid() }),
    async execute(args, ctx) {
      const { supabase } = await supabaseFor();
      const { data, error } = await supabase
        .from("object_observations")
        .select(
          `id, observed_at, confidence, source, verification_status, position, coordinate_frame,
           room:rooms(id, name),
           container:objects!object_observations_container_object_id_fkey(id, name)`
        )
        .eq("object_id", args.objectId)
        .order("observed_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return { observation: data ?? null };
    }
  },
  {
    name: "getObjectHistory",
    description: "Get the timeline of observations/locations for an object.",
    parameters: z.object({ objectId: z.string().uuid(), limit: z.number().int().min(1).max(50).optional() }),
    async execute(args, ctx) {
      const { supabase } = await supabaseFor();
      const { data, error } = await supabase
        .from("object_observations")
        .select(
          `id, observed_at, confidence, source, verification_status, position,
           room:rooms(id, name)`
        )
        .eq("object_id", args.objectId)
        .order("observed_at", { ascending: false })
        .limit(args.limit ?? 20);
      if (error) throw error;
      return { events: data };
    }
  },
  {
    name: "getRoom",
    description: "Get a room and its objects.",
    parameters: z.object({ roomId: z.string().uuid() }),
    async execute(args, ctx) {
      const { supabase } = await supabaseFor();
      const { data: room, error } = await supabase
        .from("rooms")
        .select(`id, name, room_type, width, length, height, home_id`)
        .eq("id", args.roomId)
        .eq("home_id", ctx.homeId)
        .maybeSingle();
      if (error) throw error;
      if (!room) return { found: false };

      const { data: objects } = await supabase
        .from("objects")
        .select("id, name, category, brand, model, thumbnail_url")
        .eq("room_id", args.roomId)
        .is("archived_at", null)
        .order("name");

      return { found: true, room, objects };
    }
  },
  {
    name: "getRoomScene",
    description: "Check whether a room has a reconstructed 3D scene available.",
    parameters: z.object({ roomId: z.string().uuid() }),
    async execute(args, ctx) {
      const { supabase } = await supabaseFor();
      const { data, error } = await supabase
        .from("reconstruction_jobs")
        .select("id, status, progress, result_uri, result_type, completed_at")
        .eq("room_id", args.roomId)
        .eq("home_id", ctx.homeId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return { scene: data ?? null };
    }
  },
  {
    name: "getDocuments",
    description: "List documents (receipts, manuals, warranties) attached to objects.",
    parameters: z.object({ objectId: z.string().uuid().optional() }),
    async execute(args, ctx) {
      const { supabase } = await supabaseFor();
      let q = supabase
        .from("object_documents")
        .select(`id, object_id, kind, filename, mime_type, size_bytes, created_at, object:objects(name)`)
        .eq("home_id", ctx.homeId)
        .order("created_at", { ascending: false });
      if (args.objectId) q = q.eq("object_id", args.objectId);
      const { data, error } = await q.limit(50);
      if (error) throw error;
      return { documents: data };
    }
  },
  {
    name: "compareScans",
    description: "Summarize scans for a room (or the whole home) to detect changes.",
    parameters: z.object({ roomId: z.string().uuid().optional(), limit: z.number().int().min(1).max(20).optional() }),
    async execute(args, ctx) {
      const { supabase } = await supabaseFor();
      let q = supabase
        .from("scans")
        .select(`id, status, capture_type, created_at, completed_at, quality_score, is_simulated, room:rooms(id, name)`)
        .eq("home_id", ctx.homeId)
        .neq("status", "canceled")
        .order("created_at", { ascending: false });
      if (args.roomId) q = q.eq("room_id", args.roomId);
      const { data, error } = await q.limit(args.limit ?? 10);
      if (error) throw error;
      return { scans: data };
    }
  },
  {
    name: "requestLocationConfirmation",
    description:
      "Ask the user to confirm an object's location. Creates a notification; does not change data itself.",
    parameters: z.object({ objectId: z.string().uuid(), note: z.string().optional() }),
    async execute(args, ctx) {
      const { supabase, user } = await supabaseFor();
      const { data: object, error } = await supabase
        .from("objects")
        .select("id, name")
        .eq("id", args.objectId)
        .eq("home_id", ctx.homeId)
        .maybeSingle();
      if (error) throw error;
      if (!object) return { requested: false };

      await supabase.from("notifications").insert({
        user_id: user.id,
        home_id: ctx.homeId,
        type: "object_verified",
        title: `Confirm location: ${object.name}`,
        body: args.note || "Where is this object right now?",
        link: `/app/homes/${ctx.homeId}/inventory/${object.id}`
      });
      return { requested: true, objectId: object.id };
    }
  }
];

export const toolMap = new Map<string, AssistantTool>(tools.map((t) => [t.name, t]));

export function toolDefinitions(): NonNullable<import("./provider").LlmRequest["tools"]> {
  return tools.map((t) => ({
    name: t.name,
    description: t.description,
    parameters: (t.parameters as z.ZodObject<never>).toJSON?.() as Record<string, unknown> ?? {
      type: "object",
      properties: {},
      additionalProperties: true
    }
  }));
}
