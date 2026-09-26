import { describe, expect, it } from "vitest";
import { parseIndividualVsCorpMemory } from "./individualVsCorpMemory";

// 만료(8시간)는 패키지 ShMemoryControl이 판정한다 — 여기서는 복원 값의 형태·범위만 본다.
describe("individual vs corp memory payload", () => {
  const now = new Date("2026-07-11T06:00:00Z").getTime();
  const valid = { revenue: 100_000_000, expenseRate: 0.4, corpSalary: 36_000_000, savedAt: now - 60_000 };

  it("accepts a valid payload", () => {
    expect(parseIndividualVsCorpMemory(valid)?.revenue).toBe(100_000_000);
  });

  it("rejects unsafe values", () => {
    expect(parseIndividualVsCorpMemory({ ...valid, revenue: -1 })).toBeNull();
    expect(parseIndividualVsCorpMemory({ ...valid, expenseRate: 0.9 })).toBeNull();
    expect(parseIndividualVsCorpMemory({ ...valid, corpSalary: 10_000_000_001 })).toBeNull();
    expect(parseIndividualVsCorpMemory({ ...valid, revenue: "100000000" })).toBeNull();
    expect(parseIndividualVsCorpMemory({ ...valid, savedAt: 1.5 })).toBeNull();
  });

  it("rejects non-object payloads", () => {
    expect(parseIndividualVsCorpMemory(null)).toBeNull();
    expect(parseIndividualVsCorpMemory("/individual-vs-corp")).toBeNull();
    expect(parseIndividualVsCorpMemory([valid])).toBeNull();
  });
});
