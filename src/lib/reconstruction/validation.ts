import type { CaptureInput, CaptureKind, ValidationResult } from "./provider";

export const MAX_FILES = 60;
export const MAX_VIDEO_SECONDS = 120;
export const ALLOWED_MIME: Record<CaptureKind, RegExp> = {
  image: /^image\/(jpeg|png|webp|heic|heif)$/,
  video: /^video\/(mp4|quicktime|webm)$/
};

const RAW_HEIC = /^image\/(heic|heif)$/;

/**
 * Provider-independent capture validation. Runs before a scan is accepted and
 * again inside each provider's validateCapture (simulated reuses this).
 */
export function validateCapture(capture: CaptureInput): ValidationResult {
  const issues: ValidationResult["issues"] = [];

  if (capture.files.length === 0) {
    issues.push({ code: "empty_capture", message: "Add at least one photo or video.", severity: "error" });
  }
  if (capture.files.length > MAX_FILES) {
    issues.push({
      code: "too_many_files",
      message: `Up to ${MAX_FILES} files per scan are supported.`,
      severity: "error"
    });
  }

  let imageCount = 0;
  let videoCount = 0;
  let totalBytes = 0;

  for (const file of capture.files) {
    totalBytes += file.sizeBytes;
    const mime = file.mimeType.toLowerCase();
    const matchesImage = ALLOWED_MIME.image.test(mime);
    const matchesVideo = ALLOWED_MIME.video.test(mime);

    if (file.kind === "image" && !matchesImage) {
      issues.push({ code: "unsupported_type", message: `${file.filename} is not a supported image type.`, severity: "error" });
    }
    if (file.kind === "video" && !matchesVideo) {
      issues.push({ code: "unsupported_type", message: `${file.filename} is not a supported video type.`, severity: "error" });
    }
    // HEIC/HEIF is fine for storage but we warn that reconstruction may need a
    // converted JPEG copy.
    if (RAW_HEIC.test(mime)) {
      issues.push({
        code: "heic_warning",
        message: `${file.filename} is HEIC — it may be converted to JPEG before processing.`,
        severity: "warning"
      });
    }
    if (file.kind === "image") imageCount += 1;
    else videoCount += 1;
  }

  if (imageCount < 3 && videoCount === 0) {
    issues.push({
      code: "too_few_images",
      message: "A scan works best with at least 3 photos from different angles.",
      severity: "warning"
    });
  }
  if (videoCount >= 2) {
    issues.push({
      code: "multiple_videos",
      message: "Multiple videos in one scan are supported, but a single continuous walkthrough works best.",
      severity: "warning"
    });
  }
  if (totalBytes > 200 * 1024 * 1024) {
    issues.push({ code: "capture_too_large", message: "Total capture exceeds 200 MB. Split into separate scans.", severity: "error" });
  }
  if (videoCount > 0 && imageCount === 0 && capture.files[0]) {
    // single-video capture requires reasonable length; we can't know duration
    // here, so keep as warning only.
  }

  const hasErrors = issues.some((i) => i.severity === "error");
  const quality = scoreCapture(issues, imageCount, videoCount);

  return { ok: !hasErrors, issues, qualityScore: quality };
}

function scoreCapture(
  issues: ValidationResult["issues"],
  imageCount: number,
  videoCount: number
): number {
  let score = 80;
  if (issues.some((i) => i.code === "too_few_images")) score -= 15;
  if (issues.some((i) => i.code === "multiple_videos")) score -= 5;
  if (issues.some((i) => i.code === "heic_warning")) score -= 5;
  if (imageCount >= 8) score += 5;
  if (videoCount >= 1) score += 5;
  return Math.max(0, Math.min(100, score));
}
