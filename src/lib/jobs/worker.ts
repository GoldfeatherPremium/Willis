import { createAdminClient } from "@/lib/supabase/server";
import { getReconstructionProvider } from "@/lib/reconstruction";
import { getVisionProvider } from "@/lib/ai";
import { sleep } from "@/lib/utils";
import type { Database } from "@/lib/types/database";

type JobRow = Database["public"]["Tables"]["reconstruction_jobs"]["Row"];

const STALE_RUNNING_MS = 15 * 60 * 1000;

/**
 * Local background worker. Processes queued reconstruction jobs using the
 * configured provider, then runs AI object detection for completed scans.
 *
 * This is a single-pass drainer for Vercel Cron (see /api/v1/internal/worker).
 * Real deployments would swap this for Trigger.dev / Inngest; the provider
 * abstraction keeps the swap local.
 */
export async function runPendingJobs(limit = 1) {
  const admin = await createAdminClient();
  const now = Date.now();

  // Requeue stale "running" jobs (worker crashed mid-run).
  await admin
    .from("reconstruction_jobs")
    .update({ status: "queued", progress: 0 })
    .eq("status", "running")
    .lt("updated_at", new Date(now - STALE_RUNNING_MS).toISOString());

  const { data: jobs, error } = await admin
    .from("reconstruction_jobs")
    .select("*")
    .eq("status", "queued")
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) throw error;

  const processed: string[] = [];
  for (const job of jobs ?? []) {
    await processJob(job.id);
    processed.push(job.id);
  }
  return { processed };
}

interface CaptureFileLite {
  filename: string;
  kind: "image" | "video";
  mimeType: string;
  sizeBytes: number;
  storagePath: string;
}

async function loadCaptureFiles(admin: Awaited<ReturnType<typeof createAdminClient>>, scanId: string): Promise<CaptureFileLite[]> {
  const { data: assets } = await admin
    .from("scan_assets")
    .select("id, kind, mime_type, size_bytes, storage_path")
    .eq("scan_id", scanId);
  return (assets ?? []).map((a: any) => ({
    filename: a.storage_path.split("/").pop() ?? `asset-${a.id}`,
    kind: a.kind === "video" ? "video" : "image",
    mimeType: a.mime_type ?? "application/octet-stream",
    sizeBytes: a.size_bytes ?? 0,
    storagePath: a.storage_path
  }));
}

async function processJob(jobId: string) {
  const admin = await createAdminClient();
  const { data: job, error } = await admin
    .from("reconstruction_jobs")
    .select("*")
    .eq("id", jobId)
    .single();
  if (error || !job) return;

  const { data: scan } = await admin
    .from("scans")
    .select("*")
    .eq("id", job.scan_id)
    .single();
  if (!scan) {
    await failJob(admin, job, "Scan not found");
    return;
  }

  await admin
    .from("reconstruction_jobs")
    .update({ status: "running", started_at: new Date().toISOString() })
    .eq("id", job.id);
  await admin
    .from("scans")
    .update({ status: "processing" })
    .eq("id", scan.id);

  const provider = getReconstructionProvider();
  const files = await loadCaptureFiles(admin, scan.id);

  try {
    const captureInput = {
      scanId: scan.id,
      roomId: scan.room_id,
      homeId: scan.home_id,
      captureType: scan.capture_type,
      files
    };

    const validated = await provider.validateCapture(captureInput);
    if (!validated.ok) {
      const msg = validated.issues.filter((i) => i.severity === "error").map((i) => i.message).join("; ");
      await failJob(admin, job, msg || "Capture failed validation");
      return;
    }

    await provider.createJob(captureInput);

    if (provider.isSimulated) {
      for (const p of [25, 55, 85]) {
        await sleep(150);
        await admin.from("reconstruction_jobs").update({ progress: p }).eq("id", job.id);
      }
      await sleep(150);
      const result = await provider.getResult(job.id);
      await completeJob(admin, job, result);
    } else {
      const view = await provider.getJobStatus(job.id, job.provider_job_id ?? undefined);
      if (view.status === "completed") {
        const result = await provider.getResult(job.id, job.provider_job_id ?? undefined);
        await completeJob(admin, job, result);
      } else if (view.status === "failed") {
        await failJob(admin, job, view.error || "Provider reported failure");
      } else {
        await admin
          .from("reconstruction_jobs")
          .update({ progress: view.progress, provider_job_id: view.providerJobId })
          .eq("id", job.id);
      }
    }
  } catch (e) {
    await failJob(admin, job, e instanceof Error ? e.message : String(e));
  }
}

async function completeJob(
  admin: Awaited<ReturnType<typeof createAdminClient>>,
  job: JobRow,
  result: { type: string; storagePath?: string; uri?: string; thumbnailUri?: string; isSimulated: boolean }
) {
  const completedAt = new Date().toISOString();
  await admin
    .from("reconstruction_jobs")
    .update({
      status: "completed",
      progress: 100,
      result_type: result.type,
      result_uri: result.uri ?? result.storagePath ?? null,
      completed_at: completedAt,
      error: null
    })
    .eq("id", job.id);
  await admin
    .from("scans")
    .update({
      status: "completed",
      completed_at: completedAt,
      is_simulated: result.isSimulated,
      error: null
    })
    .eq("id", job.scan_id);

  await admin.from("activity_events").insert({
    home_id: job.home_id,
    type: "scan_completed",
    payload: { scan_id: job.scan_id, room_id: job.room_id, simulated: result.isSimulated }
  });

  await detectObjectsForScan(admin, job.scan_id);
}

async function failJob(
  admin: Awaited<ReturnType<typeof createAdminClient>>,
  job: JobRow,
  message: string
) {
  await admin
    .from("reconstruction_jobs")
    .update({ status: "failed", error: message.slice(0, 2000) })
    .eq("id", job.id);
  await admin
    .from("scans")
    .update({ status: "failed", error: message.slice(0, 2000) })
    .eq("id", job.scan_id);
  await admin.from("activity_events").insert({
    home_id: job.home_id,
    type: "scan_failed",
    payload: { scan_id: job.scan_id, room_id: job.room_id, error: message }
  });
}

/**
 * Runs AI object detection for a completed scan and records candidate objects
 * (verification_status = unverified) with observations + current locations.
 * The original AI extraction is preserved in objects.ai_extracted.
 */
async function detectObjectsForScan(
  admin: Awaited<ReturnType<typeof createAdminClient>>,
  scanId: string
) {
  const { data: scan } = await admin.from("scans").select("*").eq("id", scanId).single();
  if (!scan) return;
  const { data: room } = await admin.from("rooms").select("*").eq("id", scan.room_id).single();
  if (!room) return;

  const { data: assets } = await admin
    .from("scan_assets")
    .select("storage_path, kind")
    .eq("scan_id", scan.id);

  const vision = getVisionProvider();
  const detected = await vision.detectObjects({
    imagePaths: (assets ?? []).filter((a) => a.kind === "image").map((a: any) => a.storage_path),
    roomType: room.room_type,
    roomName: room.name,
    homeId: scan.home_id,
    scanId: scan.id
  });

  const { data: existing } = await admin
    .from("objects")
    .select("id, name")
    .eq("home_id", scan.home_id)
    .is("archived_at", null);

  const existingNames = new Set((existing ?? []).map((o: any) => o.name.toLowerCase()));

  const { data: homeOwner } = await admin.from("homes").select("owner_id").eq("id", scan.home_id).single();

  for (const d of detected) {
    const name = d.name.trim();
    if (!name || existingNames.has(name.toLowerCase())) continue;
    existingNames.add(name.toLowerCase());

    const { data: obj, error } = await admin
      .from("objects")
      .insert({
        home_id: scan.home_id,
        room_id: scan.room_id,
        name,
        category: d.category,
        description: d.description ?? null,
        brand: d.brand ?? null,
        model: d.model ?? null,
        created_by: homeOwner?.owner_id,
        source_scan_id: scan.id,
        ai_extracted: {
          provider: vision.name,
          simulated: vision.isSimulated,
          confidence: d.confidence,
          boundingBox: d.boundingBox ?? null,
          detectedAt: new Date().toISOString()
        },
        is_demo: false
      })
      .select()
      .single();

    if (error || !obj) continue;

    await admin.from("object_observations").insert({
      object_id: obj.id,
      scan_id: scan.id,
      room_id: scan.room_id,
      position: { x: 0.5, y: 0.5, z: 0.5 },
      confidence: d.confidence,
      source: vision.isSimulated ? "ai_simulated" : "ai",
      verification_status: "unverified"
    });

    await admin.from("object_locations").insert({
      object_id: obj.id,
      home_id: scan.home_id,
      room_id: scan.room_id,
      position: { x: 0.5, y: 0.5, z: 0.5 },
      source: vision.isSimulated ? "ai_simulated" : "ai",
      confidence: d.confidence,
      verification_status: "unverified",
      is_current: true
    });

    await admin.from("activity_events").insert({
      home_id: scan.home_id,
      type: "object_created",
      payload: { object_id: obj.id, name, scan_id: scan.id, simulated: vision.isSimulated }
    });
  }
}
