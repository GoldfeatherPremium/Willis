import type { JobStatus, ScanCaptureType } from "@/lib/types/database";

/** Capture media kinds accepted by reconstruction providers. */
export type CaptureKind = "image" | "video";

export interface CaptureFile {
  filename: string;
  kind: CaptureKind;
  mimeType: string;
  sizeBytes: number;
  storagePath: string;
}

export interface CaptureInput {
  scanId: string;
  roomId: string;
  homeId: string;
  captureType: ScanCaptureType;
  files: CaptureFile[];
}

export interface ValidationIssue {
  code: string;
  message: string;
  severity: "error" | "warning";
}

export interface ValidationResult {
  ok: boolean;
  issues: ValidationIssue[];
  qualityScore?: number;
}

export type ReconstructionResultType = "gaussian-splat" | "mesh" | "point-cloud";

export interface ReconstructionResult {
  type: ReconstructionResultType;
  /** Public transient URL for the viewer (signed). */
  uri?: string;
  /** Storage path in the private bucket. */
  storagePath?: string;
  thumbnailUri?: string;
  cameraPoses?: unknown;
  textures?: unknown;
  /** MUST be true when the result was produced by a development adapter. */
  isSimulated: boolean;
}

export interface ReconstructionJobView {
  providerJobId?: string;
  status: JobStatus;
  progress: number;
  error?: string;
  result?: ReconstructionResult;
  completedAt?: string;
}

export interface ReconstructionInput {
  scanId: string;
  roomId: string;
  homeId: string;
  captureType: ScanCaptureType;
  files: CaptureFile[];
}

/**
 * Provider contract for photogrammetry / 3D reconstruction services
 * (COLMAP, Gaussian Splatting pipelines, nerfstudio, cloud services, ...).
 *
 * Adapters must map the REAL provider contract into this shape. Never map a
 * simulated response to a real success.
 */
export interface ReconstructionProvider {
  /** Stable identifier stored in `scans.provider`. */
  readonly name: string;
  /** True when this adapter produces simulated (non-real) results. */
  readonly isSimulated: boolean;
  /** Validate a capture BEFORE creating a job. */
  validateCapture(input: CaptureInput): Promise<ValidationResult>;
  /** Submit a job to the provider. Returns the provider's job id if any. */
  createJob(input: ReconstructionInput): Promise<{ providerJobId?: string }>;
  /** Poll current status/progress from the provider. */
  getJobStatus(jobId: string, providerJobId?: string): Promise<ReconstructionJobView>;
  /** Fetch the reconstructed assets once complete. */
  getResult(jobId: string, providerJobId?: string): Promise<ReconstructionResult>;
  /** Request cancellation from the provider. */
  cancelJob(jobId: string, providerJobId?: string): Promise<void>;
}

export class ReconstructionProviderError extends Error {
  constructor(message: string, public code = "provider_error") {
    super(message);
  }
}
