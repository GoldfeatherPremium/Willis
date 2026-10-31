import {
  withErrorHandling,
  ok,
  requireApiUser
} from "@/lib/api-helpers";
import { getUsageForUser } from "@/lib/server/quota";
import { getPlan } from "@/lib/config/plans";

export const GET = withErrorHandling(async () => {
  const user = await requireApiUser();
  const usage = await getUsageForUser(user.id);
  return ok({
    usage,
    plan: getPlan(usage.plan)
  });
});
