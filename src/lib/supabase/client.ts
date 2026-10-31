"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Browser-side Supabase client. Safe to import in client components.
 * Uses NEXT_PUBLIC_* env vars. Query results are loosely typed; the
 * `Database` interfaces describe payload shapes at the app layer.
 */
export function createClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and " +
        "NEXT_PUBLIC_SUPABASE_ANON_KEY (copy .env.example to .env.local)."
    );
  }

  return createBrowserClient(url, anonKey);
}

/** True when Supabase env is configured (used to render graceful "not configured" states). */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
