import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/types/database";

export type User = Awaited<ReturnType<typeof getCurrentUser>>;

/**
 * Returns the authenticated Supabase user for the current request, or null.
 * Use in Server Components after middleware already protected the route.
 */
export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  return user;
}

/**
 * Requires an authenticated user. Redirects to /login when missing.
 */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/**
 * Loads the profile row for the current user (or null when unauthenticated).
 */
export async function getCurrentProfile() {
  const user = await getCurrentUser();
  if (!user) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();
  return data;
}

/** True when the current user is a member of the given home. */
export async function isHomeMember(homeId: string): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;
  const supabase = await createClient();
  const { data } = await supabase
    .from("home_members")
    .select("id")
    .eq("home_id", homeId)
    .eq("user_id", user.id)
    .maybeSingle();
  return Boolean(data);
}

/** Result of an access check. */
export interface HomeAccess {
  ok: boolean;
  reason?: "unauthenticated" | "forbidden" | "not_found";
  role?: Database["public"]["Enums"]["member_role"];
}

/**
 * Checks the current user's membership in a home. Server-side authorization
 * gate for APIs and server actions. Never trust the client for access.
 */
export async function checkHomeAccess(homeId: string): Promise<HomeAccess> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, reason: "unauthenticated" };

  const supabase = await createClient();
  const { data } = await supabase
    .from("home_members")
    .select("role")
    .eq("home_id", homeId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!data) return { ok: false, reason: "forbidden" };
  return { ok: true, role: data.role };
}

/** Shortcut: throws/redirects when the user lacks any access to a home. */
export async function requireHomeAccess(homeId: string) {
  const access = await checkHomeAccess(homeId);
  if (!access.ok) redirect("/app");
  return access;
}

/**
 * Loads the current user's active subscription (defaults to Explorer).
 */
export async function getCurrentSubscription() {
  const user = await getCurrentUser();
  if (!user) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}

/**
 * Loads a home by id for the current user together with the member role.
 */
export async function getHomeForUser(homeId: string) {
  const access = await checkHomeAccess(homeId);
  if (!access.ok) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("homes").select("*").eq("id", homeId).maybeSingle();
  return data;
}
