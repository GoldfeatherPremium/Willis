/**
 * AI provider abstraction. All AI calls go through these interfaces so the
 * LLM, vision and embedding providers are replaceable. Simulated adapters are
 * clearly labelled and never pretend to be real.
 */

export type AiRole = "user" | "assistant" | "system";

export interface AiMessage {
  role: AiRole;
  content: string;
}

export interface ToolDefinition {
  name: string;
  description: string;
  /** JSON Schema for parameters. */
  parameters: Record<string, unknown>;
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface ToolResult {
  toolCallId: string;
  name: string;
  output: unknown;
}

export interface LlmRequest {
  messages: AiMessage[];
  tools?: ToolDefinition[];
  temperature?: number;
  maxTokens?: number;
}

export interface LlmResponse {
  content: string;
  /** Tool calls requested by the model (if tools were provided). */
  toolCalls?: ToolCall[];
  stopReason?: string;
  provider: string;
  isSimulated: boolean;
}

export interface LlmProvider {
  readonly name: string;
  readonly isSimulated: boolean;
  chat(request: LlmRequest): Promise<LlmResponse>;
}

export interface DetectedObject {
  name: string;
  category: string;
  description?: string;
  brand?: string;
  model?: string;
  confidence: number;
  boundingBox?: { x: number; y: number; width: number; height: number };
  simulated: boolean;
}

export interface VisionRequest {
  /** Storage paths of the capture assets. */
  imagePaths: string[];
  roomType: string;
  roomName: string;
  homeId: string;
  scanId: string;
}

export interface VisionProvider {
  readonly name: string;
  readonly isSimulated: boolean;
  detectObjects(request: VisionRequest): Promise<DetectedObject[]>;
}

export interface EmbeddingProvider {
  readonly name: string;
  readonly isSimulated: boolean;
  readonly dimensions: number;
  embedTexts(texts: string[]): Promise<number[][]>;
}

export class AiProviderError extends Error {
  constructor(message: string, public code = "provider_error") {
    super(message);
  }
}
