import { describe, expect, it } from "vitest";
import {
  calculateCarExpenseDeduction,
  calculateCorpTax,
  calculateMeetingCost,
} from "@/utils/bizExpansionCalc";

describe("bizExpansionCalc", () => {
  it("법인세는 누진세율을 적용한다", () => {
    const result = calculateCorpTax({ taxableIncome: 500_000_000 });
    expect(result.tax).toBe(82_500_000);
    expect(result.bracketLabel).toBe("200억원 이하");
  });

  it("업무 사용률 80%면 업무용 차량 경비 대부분을 손금 반영한다", () => {
    const result = calculateCarExpenseDeduction({ annualCost: 12_000_000, businessUseRate: 0.8, taxRate: 0.24 });
    expect(result.deductibleAmount).toBe(9_600_000);
    expect(result.taxSaving).toBe(2_304_000);
  });

  it("회의비는 인원과 빈도에 따라 연간 예산을 계산한다", () => {
    const result = calculateMeetingCost({
      attendees: 6,
      costPerPerson: 30_000,
      meetingsPerMonth: 4,
      months: 12,
      vatIncluded: true,
    });
    expect(result.annualBudget).toBe(8_640_000);
    expect(result.vatCredit).toBe(785_455);
  });
});
