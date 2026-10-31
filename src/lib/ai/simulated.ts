/**
 * Development AI adapters. Every result is clearly labelled simulated
 * (isSimulated = true). These NEVER pretend to be a real model; they exist so
 * the full product flow can be exercised end-to-end without external keys.
 */
import type {
  DetectedObject,
  EmbeddingProvider,
  LlmProvider,
  LlmRequest,
  LlmResponse,
  VisionProvider
} from "./provider";
import type { RoomType } from "@/lib/types/database";

const SIM_DIMENSIONS = 1536;

/** Deterministic hash -> stable vector so similar text embeds similarly. */
function hashToUnitVector(seed: string): number[] {
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let i = 0; i < seed.length; i++) {
    const c = seed.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 0x01000193);
    h2 = Math.imul(h2 ^ c, 0x85ebca6b);
  }
  const x = (h1 >>> 0) / 0xffffffff;
  const y = (h2 >>> 0) / 0xffffffff;
  return [x * 2 - 1, y * 2 - 1];
}

function tokenize(text: string): string[] {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(Boolean);
}

/** Average of per-token pseudo-random basis vectors (unit-normalized). */
export function simulatedEmbed(text: string): number[] {
  const tokens = tokenize(text);
  const vec = new Array<number>(SIM_DIMENSIONS).fill(0);
  if (tokens.length === 0) {
    vec[0] = 1;
    return vec;
  }
  for (const t of tokens) {
    const [a, b] = hashToUnitVector(t);
    const idx1 = Math.abs(Math.round(a * (SIM_DIMENSIONS - 1)));
    const idx2 = Math.abs(Math.round(b * (SIM_DIMENSIONS - 1)));
    vec[idx1] = (vec[idx1] ?? 0) + 1;
    vec[idx2] = (vec[idx2] ?? 0) + 1;
  }
  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
  return vec.map((v) => v / norm);
}

export class SimulatedLlmProvider implements LlmProvider {
  readonly name = "simulated";
  readonly isSimulated = true;

  async chat(_request: LlmRequest): Promise<LlmResponse> {
    // The orchestration loop routes simulated conversations through
    // simulatedRespond() instead of this method. This exists to satisfy the
    // interface and as a fallback.
    return {
      content: "Simulated assistant. Provide a question about your home inventory.",
      provider: this.name,
      isSimulated: true
    };
  }
}

const ROOM_LIBRARY: Record<string, DetectedObject[]> = {
  living_room: [
    { name: "Sofa", category: "furniture", description: "Seating furniture", confidence: 0.94, simulated: true },
    { name: "Coffee Table", category: "furniture", description: "Low table", confidence: 0.9, simulated: true },
    { name: "Television", category: "electronics", description: "Flat-screen TV", confidence: 0.83, simulated: true },
    { name: "Bookshelf", category: "furniture", description: "Storage shelving unit", confidence: 0.82, simulated: true }
  ],
  kitchen: [
    { name: "Refrigerator", category: "appliance", description: "Refrigerator appliance", confidence: 0.96, simulated: true },
    { name: "Microwave", category: "appliance", description: "Countertop microwave", confidence: 0.92, simulated: true },
    { name: "Kettle", category: "appliance", description: "Electric kettle", confidence: 0.85, simulated: true },
    { name: "Dining Table", category: "furniture", description: "Kitchen table", confidence: 0.8, simulated: true }
  ],
  bedroom: [
    { name: "Bed", category: "furniture", description: "Bed frame with mattress", confidence: 0.97, simulated: true },
    { name: "Nightstand", category: "furniture", description: "Bedside table", confidence: 0.9, simulated: true },
    { name: "Lamp", category: "accessory", description: "Table lamp", confidence: 0.84, simulated: true },
    { name: "Wardrobe", category: "furniture", description: "Clothing storage", confidence: 0.88, simulated: true }
  ],
  bathroom: [
    { name: "Bathroom Cabinet", category: "furniture", description: "Vanity cabinet", confidence: 0.87, simulated: true },
    { name: "Towel Rack", category: "accessory", description: "Wall-mounted rack", confidence: 0.75, simulated: true }
  ],
  study: [
    { name: "Desk", category: "furniture", description: "Work desk", confidence: 0.92, simulated: true },
    { name: "Desk Chair", category: "furniture", description: "Office chair", confidence: 0.9, simulated: true },
    { name: "Laptop", category: "electronics", description: "Portable computer", confidence: 0.86, simulated: true },
    { name: "Camera", category: "electronics", description: "Digital camera", confidence: 0.8, simulated: true },
    { name: "Headphones", category: "accessory", description: "Audio headphones", confidence: 0.82, simulated: true }
  ],
  storage: [
    { name: "Storage Box", category: "storage_container", description: "Storage container", confidence: 0.9, simulated: true },
    { name: "Suitcase", category: "accessory", description: "Luggage", confidence: 0.85, simulated: true },
    { name: "Books", category: "book", description: "Box of books", confidence: 0.78, simulated: true }
  ],
  hallway: [
    { name: "Coat Rack", category: "furniture", description: "Hallway coat stand", confidence: 0.8, simulated: true }
  ],
  garage: [
    { name: "Toolbox", category: "storage_container", description: "Tools storage", confidence: 0.84, simulated: true },
    { name: "Bicycle", category: "accessory", description: "Bicycle", confidence: 0.88, simulated: true }
  ],
  balcony: [{ name: "Outdoor Chair", category: "furniture", description: "Patio seating", confidence: 0.8, simulated: true }],
  other: [
    { name: "Chair", category: "furniture", description: "Generic chair", confidence: 0.78, simulated: true },
    { name: "Table", category: "furniture", description: "Generic table", confidence: 0.78, simulated: true }
  ]
};

export class SimulatedVisionProvider implements VisionProvider {
  readonly name = "simulated";
  readonly isSimulated = true;

  async detectObjects(request: {
    imagePaths: string[];
    roomType: string;
    roomName: string;
    homeId: string;
    scanId: string;
  }): Promise<DetectedObject[]> {
    // Development adapter: returns a labelled, room-type-based library. Real
    // vision providers replace this class entirely.
    const key = (request.roomType || "other") as RoomType;
    const library = ROOM_LIBRARY[key] ?? ROOM_LIBRARY.other;
    return library.map((o) => ({ ...o }));
  }
}

export class SimulatedEmbeddingProvider implements EmbeddingProvider {
  readonly name = "simulated";
  readonly isSimulated = true;
  readonly dimensions = SIM_DIMENSIONS;

  async embedTexts(texts: string[]): Promise<number[][]> {
    return texts.map(simulatedEmbed);
  }
}
