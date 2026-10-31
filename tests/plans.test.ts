import { describe, it, expect } from "vitest";
import { evaluateUsage, getPlan, PLANS } from "@/lib/config/plans";

describe("plan definitions", () => {
  it("explorer is free with tight limits", () => {
    expect(PLANS.explorer.priceCents).toBe(0);
    expect(PLANS.explorer.maxHomes).toBe(1);
    expect(PLANS.explorer.monthlyCaptureAllowance).toBe(2);
  });

  it("collector has the highest allowances", () => {
    expect(PLANS.collector.monthlyCaptureAllowance).toBe(100);
    expect(PLANS.collector.maxFamilyMembers).toBe(10);
  });
});

describe("evaluateUsage", () => {
  const base = {
    homeCount: 0,
    roomCount: 0,
    capturesThisMonth: 0,
    familyMemberCount: 1
  };

  it("enforces home limits", () => {
    const r = evaluateUsage(getPlan("explorer"), { ...base, homeCount: 1 });
    expect(r.exceeded.homes).toBe(true);
    expect(r.exceeded.rooms).toBe(false);
  });

  it("enforces capture allowance", () => {
    const r = evaluateUsage(getPlan("personal"), { ...base, capturesThisMonth: 10 });
    expect(r.exceeded.captures).toBe(true);
  });

  it("enforces family member cap", () => {
    const r = evaluateUsage(getPlan("explorer"), { ...base, familyMemberCount: 1 });
    expect(r.exceeded.familyMembers).toBe(true);
  });

  it("does not block within limits", () => {
    const r = evaluateUsage(getPlan("family"), { ...base, homeCount: 2, capturesThisMonth: 20, familyMemberCount: 4 });
    expect(r.exceeded).toEqual({ homes: false, rooms: false, captures: false, familyMembers: false });
  });
});
