import { Users } from "lucide-react";
import { listUserHomes } from "@/lib/server/data";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/feedback";
import { FamilyManager } from "@/components/family/family-manager";

export const dynamic = "force-dynamic";

export default async function FamilyPage() {
  const homes = await listUserHomes();
  const supabase = await createClient();

  const homesWithMembers = await Promise.all(
    homes.map(async (h) => {
      const { data: members } = await supabase
        .from("home_members")
        .select("id, user_id, role, profile:profiles(id, full_name, avatar_url)")
        .eq("home_id", h.home_id);
      return {
        home_id: h.home_id,
        name: h.name,
        role: h.member_role,
        members:
          members?.map((m: any) => ({
            id: m.id,
            full_name: m.profile?.full_name ?? null,
            email: m.profile?.full_name ?? "member",
            role: m.role
          })) ?? []
      };
    })
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-primary">Family & sharing</h1>
        <p className="mt-1 text-sm text-secondary">Invite household members to share a home's spatial memory.</p>
      </div>

      {homes.length === 0 ? (
        <Card>
          <EmptyState icon={<Users className="h-5 w-5" />} title="No homes yet" description="Create a home to start sharing." />
        </Card>
      ) : (
        <FamilyManager homes={homesWithMembers} />
      )}
    </div>
  );
}
