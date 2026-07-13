import { describe, expect, it } from "vitest";
import { positiveBarWidth } from "./chartMath";

describe("chartMath", () => {
  it("keeps comparisons on a zero baseline", () => {
    expect(positiveBarWidth(0, 100)).toBe(0);
    expect(positiveBarWidth(35, 100)).toBe(35);
  });

});
