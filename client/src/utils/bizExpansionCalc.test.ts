import { describe, expect, it } from "vitest";
import {
  calculateCarExpenseDeduction,
  calculateCorpTax,
  calculateMeetingCost,
} from "@/utils/bizExpansionCalc";
import { calculateStandardExpenseRate } from "@/utils/standardExpenseRateCalc";
import { calculateLaborCost } from "@/utils/laborCostCalc";

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

describe("standardExpenseRateCalc", () => {
  const baseInput = {
    revenue: 100_000_000,
    standardRate: 18.5,
    simpleRate: 64.1,
    purchaseCost: 10_000_000,
    rentCost: 12_000_000,
    laborCost: 15_000_000,
  };

  it("기준경비율 방식은 주요경비 + 매출×기준경비율%을 경비로 반영한다", () => {
    const result = calculateStandardExpenseRate(baseInput);
    // 주요경비 37,000,000 + 100,000,000 × 18.5% = 55,500,000
    expect(result.standard.expenses).toBe(55_500_000);
    expect(result.standard.taxableIncome).toBe(44_500_000);
  });

  it("단순경비율 방식은 매출×단순경비율%를 경비로 반영한다", () => {
    const result = calculateStandardExpenseRate(baseInput);
    // 100,000,000 × 64.1% = 64,100,000
    expect(result.simple.expenses).toBe(64_100_000);
    expect(result.simple.taxableIncome).toBe(35_900_000);
  });

  it("세금이 적은 방식을 추천한다", () => {
    const result = calculateStandardExpenseRate(baseInput);
    // 단순경비율이 경비가 더 많으므로 세금이 적음
    expect(result.recommendation).toBe("simple");
    // taxDifference = simple - standard → 음수면 simple이 유리
    expect(result.taxDifference).toBeLessThan(0);
  });

  it("주요경비가 크면 기준경비율이 유리할 수 있다", () => {
    const result = calculateStandardExpenseRate({
      ...baseInput,
      purchaseCost: 30_000_000,
      rentCost: 20_000_000,
      laborCost: 20_000_000,
    });
    // 주요경비 70,000,000 + 18,500,000 = 88,500,000 > 64,100,000
    expect(result.recommendation).toBe("standard");
  });

  it("totalTax = incomeTax + localTax (양 방식 모두)", () => {
    const result = calculateStandardExpenseRate(baseInput);
    expect(result.standard.totalTax).toBe(result.standard.incomeTax + result.standard.localTax);
    expect(result.simple.totalTax).toBe(result.simple.incomeTax + result.simple.localTax);
  });
});

describe("laborCostCalc", () => {
  const baseInput = {
    monthlySalary: 3_000_000,
    employeeCount: 1,
    industryKey: "office",
    includeRetirement: true,
  };

  it("사업주 4대보험 항목별 금액이 올바르다", () => {
    const r = calculateLaborCost(baseInput);
    // 국민연금: 3,000,000 × 4.75% = 142,500
    expect(r.employer.nationalPension).toBe(142_500);
    // 건강보험: 3,000,000 × 3.595% = 107,850
    expect(r.employer.healthInsurance).toBe(107_850);
    // 장기요양: 107,850 × 13.14% ≈ 14,171
    expect(r.employer.longTermCare).toBe(Math.round(107_850 * 0.1314));
    // 고용보험 사업주: 3,000,000 × 0.9% = 27,000
    expect(r.employer.employmentInsurance).toBe(27_000);
    // 산재(사무직): 3,000,000 × 0.7% = 21,000
    expect(r.employer.industrialAccident).toBe(21_000);
  });

  it("국민연금 상한액(637만원)이 적용된다", () => {
    const r = calculateLaborCost({ ...baseInput, monthlySalary: 8_000_000 });
    // 상한 6,370,000 × 4.75% = 302,575
    expect(r.employer.nationalPension).toBe(Math.round(6_370_000 * 0.0475));
    expect(r.employee.nationalPension).toBe(Math.round(6_370_000 * 0.0475));
  });

  it("퇴직급여 포함/미포함이 정확하다", () => {
    const withRetire = calculateLaborCost(baseInput);
    const noRetire = calculateLaborCost({ ...baseInput, includeRetirement: false });
    expect(withRetire.retirementReserve).toBe(250_000); // 3,000,000 / 12
    expect(noRetire.retirementReserve).toBe(0);
    expect(withRetire.totalCostPerEmployee - noRetire.totalCostPerEmployee).toBe(250_000);
  });

  it("직원 수 배수로 전체 인건비가 계산된다", () => {
    const r1 = calculateLaborCost(baseInput);
    const r3 = calculateLaborCost({ ...baseInput, employeeCount: 3 });
    expect(r3.totalMonthlyCost).toBe(r1.totalCostPerEmployee * 3);
    expect(r3.totalAnnualCost).toBe(r3.totalMonthlyCost * 12);
  });

  it("overheadRate = (총비용 - 급여) / 급여", () => {
    const r = calculateLaborCost(baseInput);
    const expected = (r.totalCostPerEmployee - r.monthlySalary) / r.monthlySalary;
    expect(r.overheadRate).toBeCloseTo(expected, 10);
  });
});
