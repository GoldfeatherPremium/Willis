import { describe, it, expect } from "vitest";
import { formatRelativeTime, initials, truncate, pluralize, formatCurrency } from "@/lib/utils";

describe("formatRelativeTime", () => {
  it("formats seconds and minutes", () => {
    expect(formatRelativeTime(new Date(Date.now() - 10_000))).toBe("10s ago");
    expect(formatRelativeTime(new Date(Date.now() - 120_000))).toBe("2m ago");
  });

  it("falls back to a date for old timestamps", () => {
    const out = formatRelativeTime("2020-01-01T00:00:00Z", new Date("2024-01-01T00:00:00Z").getTime());
    expect(out).toMatch(/2020/);
  });
});

describe("initials", () => {
  it("takes first two initials", () => {
    expect(initials("Ada Lovelace")).toBe("AL");
    expect(initials("ada")).toBe("A");
    expect(initials("")).toBe("");
  });
});

describe("truncate", () => {
  it("adds ellipsis only when needed", () => {
    expect(truncate("short", 60)).toBe("short");
    expect(truncate("a".repeat(100), 20)).toBe("a".repeat(19) + "…");
  });
});

describe("pluralize", () => {
  it("handles singular and plural", () => {
    expect(pluralize(1, "room")).toBe("room");
    expect(pluralize(2, "room")).toBe("rooms");
    expect(pluralize(2, "box", "boxes")).toBe("boxes");
  });
});

describe("formatCurrency", () => {
  it("formats cents", () => {
    expect(formatCurrency(0)).toBe("$0");
    expect(formatCurrency(599)).toBe("$5.99");
    expect(formatCurrency(1199)).toBe("$11.99");
  });
});
