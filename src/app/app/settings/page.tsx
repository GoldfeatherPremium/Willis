import { requireUser, getCurrentProfile } from "@/lib/auth";
import { ProfileSettings } from "@/components/settings/profile-settings";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await requireUser();
  const profile = await getCurrentProfile();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-primary">Settings</h1>
        <p className="mt-1 text-sm text-secondary">Manage your profile and account.</p>
      </div>
      <ProfileSettings email={user.email ?? null} initialName={profile?.full_name ?? ""} />
    </div>
  );
}
