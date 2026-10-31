import { requireApiHomeAccess } from "@/lib/api-helpers";
import { listUserHomes } from "@/lib/server/data";
import { Card } from "@/components/ui/card";
import { AssistantChat } from "@/components/assistant/assistant-chat";
import { HomeSwitcher } from "@/components/shell/home-switcher";

export const dynamic = "force-dynamic";

export default async function AssistantPage({
  searchParams
}: {
  searchParams: Promise<{ home?: string }>;
}) {
  const homes = await listUserHomes();
  const sp = await searchParams;
  const activeId = sp.home ?? homes[0]?.home_id;

  let homeId = activeId;
  if (!homeId) {
    homeId = "none";
  } else {
    await requireApiHomeAccess(homeId);
  }

  const simulated = (process.env.AI_LLM_PROVIDER || "simulated") === "simulated";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-primary">AI Assistant</h1>
          <p className="mt-1 text-sm text-secondary">Ask anything about your home. Get answers from your real data.</p>
        </div>
        {homes.length > 0 && <HomeSwitcher homes={homes} activeId={homeId} />}
      </div>

      {homeId === "none" ? (
        <Card className="p-10 text-center">
          <p className="font-display text-base font-semibold text-primary">Create a home first</p>
          <p className="mt-1 text-sm text-secondary">The assistant works on your home's actual inventory.</p>
        </Card>
      ) : (
        <AssistantChat homeId={homeId} simulated={simulated} />
      )}
    </div>
  );
}
