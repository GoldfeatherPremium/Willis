import type {
  CaptureInput,
  ReconstructionInput,
  ReconstructionJobView,
  ReconstructionProvider,
  ReconstructionResult,
  ValidationResult
} from "./provider";
import { validateCapture } from "./validation";
import { sleep } from "@/lib/utils";

/**
 * Development adapter. NEVER produces a real reconstruction — every result is
 * tagged isSimulated = true and the UI labels it "Simulated".
 */
export class SimulatedReconstructionProvider implements ReconstructionProvider {
  readonly name = "simulated";
  readonly isSimulated = true;

  async validateCapture(capture: CaptureInput): Promise<ValidationResult> {
    // Simulate a short processing step so the UI shows real progress.
    await sleep(250);
    return validateCapture(capture);
  }

  async createJob(_input: ReconstructionInput): Promise<{ providerJobId?: string }> {
    // All work happens in the local worker loop; no external job id.
    return {};
  }

  async getJobStatus(_jobId: string): Promise<ReconstructionJobView> {
    // Status is driven by the worker's progress updates, so a fresh simulated
    // job is simply "running" until the worker completes it.
    return { status: "running", progress: 0 };
  }

  async getResult(jobId: string): Promise<ReconstructionResult> {
    // The worker generates a result asset when it completes the job; here we
    // return the generic simulated marker.
    return {
      type: "point-cloud",
      storagePath: `simulated/${jobId}/scene.glb`,
      isSimulated: true
    };
  }

  async cancelJob(_jobId: string): Promise<void> {
    // Nothing external to cancel.
  }
}
