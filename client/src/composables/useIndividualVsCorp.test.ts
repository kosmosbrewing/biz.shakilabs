import { describe, expect, it } from "vitest";
import { parseIndividualVsCorpDraft } from "./useIndividualVsCorp";

describe("individual vs corp session draft", () => {
  const now = new Date("2026-07-11T06:00:00Z").getTime();
  const valid = { revenue: 100_000_000, expenseRate: 0.4, corpSalary: 36_000_000 };

  it("accepts a valid draft within eight hours", () => {
    expect(parseIndividualVsCorpDraft(JSON.stringify({ ...valid, savedAt: now - 60_000 }), now)?.revenue)
      .toBe(100_000_000);
  });

  it("rejects unsafe and expired values", () => {
    expect(parseIndividualVsCorpDraft(JSON.stringify({ ...valid, revenue: -1, savedAt: now }), now)).toBeNull();
    expect(parseIndividualVsCorpDraft(JSON.stringify({ ...valid, savedAt: now - 9 * 60 * 60 * 1000 }), now)).toBeNull();
  });
});
