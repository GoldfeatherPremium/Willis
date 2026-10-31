import { describe, it, expect } from "vitest";
import { simulatedEmbed, SimulatedVisionProvider, SimulatedEmbeddingProvider } from "@/lib/ai/simulated";

function cosine(a: number[], b: number[]): number {
  let dot = 0;
  for (let i = 0; i < a.length; i++) dot += a[i]! * b[i]!;
  return dot;
}

describe("simulatedEmbed", () => {
  it("is deterministic", () => {
    const a = simulatedEmbed("camera battery");
    const b = simulatedEmbed("camera battery");
    expect(a).toEqual(b);
    expect(a).toHaveLength(1536);
  });

  it("produces unit vectors", () => {
    const v = simulatedEmbed("sofa");
    const norm = Math.sqrt(v.reduce((s, x) => s + x * x, 0));
    expect(norm).toBeCloseTo(1, 3);
  });

  it("ranks similar text above unrelated text", () => {
    const query = simulatedEmbed("camera battery");
    const near = simulatedEmbed("camera battery charger");
    const far = simulatedEmbed("garden watering can");
    expect(cosine(query, near)).toBeGreaterThan(cosine(query, far));
  });
});

describe("SimulatedEmbeddingProvider", () => {
  it("embeds a batch at the declared dimension", async () => {
    const p = new SimulatedEmbeddingProvider();
    const out = await p.embedTexts(["a", "b", "c"]);
    expect(out).toHaveLength(3);
    expect(out[0]).toHaveLength(p.dimensions);
    expect(p.isSimulated).toBe(true);
  });
});

describe("SimulatedVisionProvider", () => {
  it("returns clearly-labelled simulated detections and never claims real ones", async () => {
    const p = new SimulatedVisionProvider();
    const out = await p.detectObjects({
      imagePaths: ["a.jpg"],
      roomType: "study",
      roomName: "Study",
      homeId: "h1",
      scanId: "s1"
    });
    expect(out.length).toBeGreaterThan(0);
    for (const o of out) expect(o.simulated).toBe(true);
  });
});
