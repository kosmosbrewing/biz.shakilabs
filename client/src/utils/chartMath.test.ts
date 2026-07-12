import { describe, expect, it } from "vitest";
import { normalizeSegments, positiveBarWidth } from "./chartMath";

describe("chartMath", () => {
  it("keeps comparisons on a zero baseline", () => {
    expect(positiveBarWidth(0, 100)).toBe(0);
    expect(positiveBarWidth(35, 100)).toBe(35);
  });

  it("normalizes exact business cost components", () => {
    expect(normalizeSegments([50, 30, 20])).toEqual([0.5, 0.3, 0.2]);
  });
});
