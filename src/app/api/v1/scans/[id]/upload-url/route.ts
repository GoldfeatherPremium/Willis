import { z } from "zod";
import { randomUUID } from "crypto";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import {
  withErrorHandling,
  ok,
  requireApiUser,
  requireApiHomeAccess,
  parseIdParam,
  ApiError
} from "@/lib/api-helpers";

const uploadUrlSchema = z.object({
  filename: z.string().trim().min(1).max(200).regex(/^[\w.\-() ]+$/, "Invalid filename"),
  kind: z.enum(["image", "video"]),
  mimeType: z.string().optional()
});

export const POST = withErrorHandling(async (request, ctx) => {
  const user = await requireApiUser();
  const scanId = parseIdParam((await ctx.params).id, "id");
  const body = uploadUrlSchema.parse(await request.json());

  const supabase = await createClient();
  const { data: scan } = await supabase.from("scans").select("id, home_id").eq("id", scanId).maybeSingle();
  if (!scan) throw new ApiError(404, "Scan not found.", "not_found");
  await requireApiHomeAccess(scan.home_id);

  const ext = body.filename.split(".").pop()?.toLowerCase() ?? "";
  const storagePath = `${user.id}/scans/${scanId}/${Date.now()}-${randomUUID().slice(0, 8)}.${ext}`;

  const admin = await createAdminClient();
  const { data: upload, error } = await admin.storage
    .from("home-media")
    .createSignedUploadUrl(storagePath);
  if (error) throw new ApiError(500, "Could not create upload URL.", "storage_error");

  const { error: assetError } = await admin.from("scan_assets").insert({
    scan_id: scanId,
    kind: body.kind,
    storage_path: storagePath,
    mime_type: body.mimeType ?? null,
    size_bytes: 0
  });
  if (assetError) throw assetError;

  return ok({
    uploadUrl: upload.signedUrl,
    storagePath,
    token: upload.token,
    headers: { "x-upsert": "false" }
  });
});
