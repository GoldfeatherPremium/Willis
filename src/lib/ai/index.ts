import type { EmbeddingProvider, LlmProvider, VisionProvider } from "./provider";
import {
  SimulatedEmbeddingProvider,
  SimulatedLlmProvider,
  SimulatedVisionProvider
} from "./simulated";

/**
 * AI provider factories. Reads env config; without real keys every provider
 * defaults to a clearly-labelled simulated adapter.
 */
export function getLlmProvider(): LlmProvider {
  const provider = process.env.AI_LLM_PROVIDER || "simulated";
  switch (provider) {
    case "openai":
    case "anthropic":
      throw new Error(
        `AI LLM provider "${provider}" is configured but not yet wired. ` +
          "Set AI_LLM_PROVIDER=simulated, or add the adapter for this provider."
      );
    case "simulated":
    default:
      return new SimulatedLlmProvider();
  }
}

export function getVisionProvider(): VisionProvider {
  const provider = process.env.AI_VISION_PROVIDER || "simulated";
  switch (provider) {
    case "openai":
    case "anthropic":
      throw new Error(
        `AI vision provider "${provider}" is configured but not yet wired. ` +
          "Set AI_VISION_PROVIDER=simulated, or add the adapter for this provider."
      );
    case "simulated":
    default:
      return new SimulatedVisionProvider();
  }
}

export function getEmbeddingProvider(): EmbeddingProvider {
  const provider = process.env.AI_EMBEDDING_PROVIDER || "simulated";
  switch (provider) {
    case "openai":
    case "anthropic":
      throw new Error(
        `AI embedding provider "${provider}" is configured but not yet wired. ` +
          "Set AI_EMBEDDING_PROVIDER=simulated, or add the adapter for this provider."
      );
    case "simulated":
    default:
      return new SimulatedEmbeddingProvider();
  }
}

export type { DetectedObject } from "./provider";
export { simulatedEmbed } from "./simulated";
