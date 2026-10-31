import { describe, it, expect } from "vitest";
import { validateCapture } from "@/lib/reconstruction/validation";
import type { CaptureInput } from "@/lib/reconstruction/provider";

function capture(files: CaptureInput["files"]): CaptureInput {
  return { scanId: "s1", roomId: "r1", homeId: "h1", captureType: "photos", files };
}

const img = (n: number) => ({
  filename: `photo-${n}.jpg`,
  kind: "image" as const,
  mimeType: "image/jpeg",
  sizeBytes: 2_000_000,
  storagePath: `u/scans/s1/photo-${n}.jpg`
});

describe("validateCapture", () => {
  it("rejects empty captures", () => {
    const r = validateCapture(capture([]));
    expect(r.ok).toBe(false);
    expect(r.issues.some((i) => i.code === "empty_capture")).toBe(true);
  });

  it("accepts a healthy multi-image capture", () => {
    const r = validateCapture(capture([img(1), img(2), img(3), img(4)]));
    expect(r.ok).toBe(true);
    expect(r.issues.filter((i) => i.severity === "error")).toHaveLength(0);
  });

  it("warns below three images", () => {
    const r = validateCapture(capture([img(1), img(2)]));
    expect(r.ok).toBe(true);
    expect(r.issues.some((i) => i.code === "too_few_images")).toBe(true);
    expect(r.qualityScore).toBeLessThan(80);
  });

  it("rejects unsupported media types", () => {
    const r = validateCapture(capture([
      { ...img(1), mimeType: "application/zip", kind: "image" }
    ]));
    expect(r.ok).toBe(false);
    expect(r.issues.some((i) => i.code === "unsupported_type")).toBe(true);
  });

  it("rejects oversized captures", () => {
    const r = validateCapture(capture([
      { ...img(1), sizeBytes: 150 * 1024 * 1024 },
      { ...img(2), sizeBytes: 100 * 1024 * 1024 }
    ]));
    expect(r.ok).toBe(false);
    expect(r.issues.some((i) => i.code === "capture_too_large")).toBe(true);
  });

  it("flags HEIC for conversion", () => {
    const r = validateCapture(capture([{ ...img(1), mimeType: "image/heic" }, img(2), img(3)]));
    expect(r.issues.some((i) => i.code === "heic_warning")).toBe(true);
  });
});
