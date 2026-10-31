import { ReconstructionProvider } from "./provider";
import { SimulatedReconstructionProvider } from "./simulated";

/**
 * Returns the configured reconstruction provider based on the
 * RECONSTRUCTION_PROVIDER env var (default "simulated").
 *
 * Real providers (e.g. a self-hosted COLMAP/nerfstudio pipeline) are
 * instantiated here when credentials/URLs are present. Without credentials we
 * always return the clearly-labelled simulated adapter.
 */
export function getReconstructionProvider(): ReconstructionProvider {
  const provider = process.env.RECONSTRUCTION_PROVIDER || "simulated";

  switch (provider) {
    case "simulated":
    default:
      return new SimulatedReconstructionProvider();
  }
}

export { ReconstructionProviderError } from "./provider";
export { validateCapture } from "./validation";
export type {
  CaptureFile,
  CaptureInput,
  ReconstructionInput,
  ReconstructionJobView,
  ReconstructionResult,
  ReconstructionResultType,
  ValidationIssue,
  ValidationResult
} from "./provider";
