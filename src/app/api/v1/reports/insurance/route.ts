import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  withErrorHandling,
  ok,
  requireApiUser,
  requireApiHomeAccess
} from "@/lib/api-helpers";
import { generateInsuranceReport } from "@/lib/export/insurance";

const reportSchema = z.object({ homeId: z.string().uuid() });

export const POST = withErrorHandling(async (request) => {
  const user = await requireApiUser();
  const body = reportSchema.parse(await request.json());
  await requireApiHomeAccess(body.homeId);

  const { storagePath, filename } = await generateInsuranceReport(body.homeId);

  const supabase = await createClient();
  const { data: signed } = await supabase.storage
    .from("exports")
    .createSignedUrl(storagePath, 60 * 60 * 24);

  return ok({
    storagePath,
    filename,
    downloadUrl: signed?.signedUrl ?? null,
    generatedBy: user.id
  });
});
