import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";

type CookieToSet = { name: string; value: string; options: CookieOptions };

/**
 * Server-side Supabase client bound to the current request's cookie store.
 * Use in Server Components, Route Handlers and Server Actions.
 *
 * Note: query results are intentionally loosely typed. The `Database` row
 * interfaces in src/lib/types/database.ts are used at the app layer for
 * payload shapes; the client itself is untyped to keep dynamic joins (objects
 * -> rooms -> locations) practical. RLS still enforces authorization.
 */
export async function createClient(): Promise<SupabaseClient> {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // Called from a Server Component when cookies are read-only; ignore.
          }
        }
      }
    }
  );
}

export async function createAdminClient(): Promise<SupabaseClient> {
  const { createClient: createSupabaseClient } = await import("@supabase/supabase-js");
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!serviceRoleKey || !url) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured (server-only).");
  }

  return createSupabaseClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}
