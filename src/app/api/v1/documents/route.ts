import { z } from "zod";
import { randomUUID } from "crypto";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import {
  withErrorHandling,
  ok,
  requireApiUser,
  requireApiHomeAccess,
  ApiError
} from "@/lib/api-helpers";
import { DOCUMENT_KINDS } from "@/lib/types/constants";

const documentSchema = z.object({
  objectId: z.string().uuid(),
  kind: z.enum(DOCUMENT_KINDS).optional(),
  filename: z.string().trim().min(1).max(200).regex(/^[\w.\-() ]+$/, "Invalid filename")
});

/**
 * Creates a signed upload URL in the private `documents` bucket and records the
 * document row. The client PUTs the file to the returned URL.
 */
export const POST = withErrorHandling(async (request) => {
  const user = await requireApiUser();
  const body = documentSchema.parse(await request.json());

  const supabase = await createClient();
  const { data: object } = await supabase.from("objects").select("id, home_id").eq("id", body.objectId).maybeSingle();
  if (!object) throw new ApiError(404, "Object not found.", "not_found");
  await requireApiHomeAccess(object.home_id);

  const ext = body.filename.split(".").pop()?.toLowerCase() ?? "bin";
  const storagePath = `${user.id}/documents/${body.objectId}/${Date.now()}-${randomUUID().slice(0, 8)}.${ext}`;

  const admin = await createAdminClient();
  const { data: upload, error } = await admin.storage.from("documents").createSignedUploadUrl(storagePath);
  if (error) throw new ApiError(500, "Could not create upload URL.", "storage_error");

  const { error: rowError } = await admin.from("object_documents").insert({
    object_id: body.objectId,
    home_id: object.home_id,
    kind: (body.kind ?? "other") as never,
    storage_path: storagePath,
    filename: body.filename,
    uploaded_by: user.id,
    size_bytes: 0
  });
  if (rowError) throw rowError;

  return ok({ uploadUrl: upload.signedUrl, storagePath, token: upload.token });
});
