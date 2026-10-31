import { requireUser, getCurrentProfile } from "@/lib/auth";
import { listUserHomes } from "@/lib/server/data";
import { AppShell } from "@/components/shell/app-shell";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const profile = await getCurrentProfile();
  let homes: Awaited<ReturnType<typeof listUserHomes>> = [];
  try {
    homes = await listUserHomes();
  } catch {
    // Supabase not configured / session issue — render shell anyway.
  }

  return (
    <AppShell user={user} profile={profile} homes={homes}>
      {children}
    </AppShell>
  );
}
