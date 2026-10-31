"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Camera, Upload, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/feedback";
import { cn } from "@/lib/utils";

type FileStatus = {
  id: string;
  name: string;
  state: "pending" | "uploading" | "uploaded" | "error";
  progress: number;
  error?: string;
};

export function CaptureFlow({
  roomId,
  homeId,
  isSimulatedProvider
}: {
  roomId: string;
  homeId: string;
  isSimulatedProvider: boolean;
}) {
  const router = useRouter();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [files, setFiles] = React.useState<FileStatus[]>([]);
  const [phase, setPhase] = React.useState<"idle" | "creating" | "uploading" | "processing" | "done" | "error">("idle");
  const [scanId, setScanId] = React.useState<string | null>(null);
  const [jobId, setJobId] = React.useState<string | null>(null);
  const [jobProgress, setJobProgress] = React.useState(0);
  const [message, setMessage] = React.useState<string | null>(null);

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []);
    setFiles(
      picked.map((f) => ({ id: crypto.randomUUID(), name: f.name, state: "pending" as const, progress: 0 }))
    );
    setPhase("idle");
    setMessage(null);
  }

  async function start() {
    const fileList = Array.from(inputRef.current?.files ?? []);
    if (fileList.length === 0) return;
    setPhase("creating");
    setMessage(null);

    try {
      // 1) Create the scan
      const captureType = fileList.some((f) => f.type.startsWith("video/")) ? "video" : "photos";
      const scanRes = await fetch("/api/v1/scans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId, captureType })
      });
      const scanJson = await scanRes.json();
      if (!scanRes.ok) throw new Error(scanJson?.error?.message ?? "Could not start scan.");
      setScanId(scanJson.data.scan.id);
      setJobId(scanJson.data.job.id);
      setPhase("uploading");

      // 2) Upload each file via signed URL
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i]!;
        setFiles((prev) => prev.map((f, idx) => (idx === i ? { ...f, state: "uploading", progress: 10 } : f)));

        const urlRes = await fetch(`/api/v1/scans/${scanJson.data.scan.id}/upload-url`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filename: file.name,
            kind: file.type.startsWith("video/") ? "video" : "image",
            mimeType: file.type
          })
        });
        const urlJson = await urlRes.json();
        if (!urlRes.ok) throw new Error(urlJson?.error?.message ?? "Could not create upload URL.");

        const putRes = await fetch(urlJson.data.uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": file.type, "x-upsert": "false" },
          body: file
        });
        if (!putRes.ok) {
          throw new Error(`Upload failed for ${file.name} (${putRes.status}).`);
        }
        setFiles((prev) => prev.map((f, idx) => (idx === i ? { ...f, state: "uploaded", progress: 100 } : f)));
      }

      // 3) Mark complete → start processing
      const doneRes = await fetch(`/api/v1/scans/${scanJson.data.scan.id}/complete`, { method: "POST" });
      const doneJson = await doneRes.json();
      if (!doneRes.ok) throw new Error(doneJson?.error?.message ?? "Could not finalize scan.");
      if (doneJson.data.job) setJobId(doneJson.data.job.id);
      setPhase("processing");

      // 4) Poll the reconstruction job
      await pollJob(doneJson.data.job?.id ?? scanJson.data.job.id);
    } catch (err) {
      setPhase("error");
      setMessage(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  async function pollJob(id: string) {
    for (let i = 0; i < 60; i++) {
      await new Promise((r) => setTimeout(r, 1600));
      const res = await fetch(`/api/v1/jobs/${id}`);
      const json = await res.json();
      if (!res.ok) continue;
      const job = json.data.job;
      setJobProgress(job.progress ?? 0);
      if (job.status === "completed") {
        setPhase("done");
        setJobProgress(100);
        router.refresh();
        return;
      }
      if (job.status === "failed") {
        setPhase("error");
        setMessage(job.error ?? "Reconstruction failed.");
        router.refresh();
        return;
      }
    }
    setPhase("error");
    setMessage("Processing timed out. Check your scans page shortly.");
  }

  const busy = phase === "creating" || phase === "uploading" || phase === "processing";

  return (
    <div className="rounded-card border bg-surface/60 p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Camera className="h-4 w-4 text-accent" />
          <h3 className="font-display text-sm font-semibold text-primary">Scan this room</h3>
        </div>
        {isSimulatedProvider && <Badge tone="warm">Simulated (dev) reconstruction</Badge>}
      </div>

      <input ref={inputRef} type="file" multiple accept="image/jpeg,image/png,image/webp,image/heic,video/mp4,video/quicktime" className="hidden" onChange={onPick} />

      {phase === "idle" && (
        <button
          onClick={() => inputRef.current?.click()}
          className="mt-4 flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border py-10 text-secondary transition-colors hover:border-accent/40 hover:text-primary"
        >
          <Upload className="h-6 w-6" />
          <span className="text-sm font-medium">Choose photos or a short video</span>
          <span className="text-xs text-secondary">3+ photos from different angles work best</span>
        </button>
      )}

      {files.length > 0 && (
        <ul className="mt-4 space-y-2">
          {files.map((f, i) => (
            <li key={f.id} className="flex items-center gap-3 rounded-lg border border-border bg-bg-secondary/60 px-3 py-2 text-sm">
              <span className="min-w-0 flex-1 truncate text-primary">{f.name}</span>
              {f.state === "uploading" && <ProgressBar value={f.progress} className="w-24" />}
              {f.state === "uploaded" && <CheckCircle2 className="h-4 w-4 text-success" />}
              {f.state === "error" && <XCircle className="h-4 w-4 text-error" />}
              {i === files.length - 1 && f.state === "pending" && (
                <span className="text-xs text-secondary">ready</span>
              )}
            </li>
          ))}
        </ul>
      )}

      {message && (
        <div className={cn("mt-4 rounded-xl border px-3.5 py-2.5 text-sm", phase === "error" ? "border-error/25 bg-error/10 text-error" : "border-accent/25 bg-accent-soft text-accent")}>
          {message}
        </div>
      )}

      {phase === "processing" && (
        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-secondary">Reconstructing room…</span>
            <span className="tnum text-primary">{Math.round(jobProgress)}%</span>
          </div>
          <ProgressBar value={jobProgress} />
        </div>
      )}

      {phase === "done" && (
        <div className="mt-4 rounded-xl border border-success/25 bg-success/10 px-3.5 py-3 text-sm text-success">
          Scan complete — items were discovered below. Review and confirm them.
        </div>
      )}

      <div className="mt-4 flex items-center gap-3">
        <Button onClick={start} loading={busy} disabled={files.length === 0 || phase === "done"}>
          {phase === "done" ? "Scan complete" : phase === "processing" ? "Processing…" : "Start scan"}
        </Button>
        {phase === "idle" && files.length > 0 && (
          <Button variant="ghost" onClick={() => { setFiles([]); if (inputRef.current) inputRef.current.value = ""; }}>
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}
