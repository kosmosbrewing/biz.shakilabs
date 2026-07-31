import { describe, expect, it } from "vitest";
import { calculateLaborCost } from "./laborCostCalc";
import { INDUSTRY_ACCIDENT_RATES } from "@/data/laborCost";
import { formatPercent } from "@/lib/utils";

function ok(input: Parameters<typeof calculateLaborCost>[0]) {
  const state = calculateLaborCost(input);
  if (!state.success) throw new Error("calculateLaborCost failed");
  return state.data;
}

describe("calculateLaborCost", () => {
  it("월급 300만원·사무직 기준 사업주 실제 인건비를 계산한다", () => {
    const result = ok({
      monthlySalary: 3_000_000,
      employeeCount: 1,
      industryKey: "office",
      includeRetirement: true,
    });

    // 국민연금 142,500 + 건보 107,850 + 장기요양 14,171 + 고용 27,000 + 산재 21,000
    expect(result.employer.totalInsurance).toBe(312_521);
    expect(result.retirementReserve).toBe(250_000);
    expect(result.totalCostPerEmployee).toBe(3_562_521);
  });

  it("overheadRate는 퍼센트가 아니라 비율(0~1)로 반환한다", () => {
    const result = ok({
      monthlySalary: 3_000_000,
      employeeCount: 1,
      industryKey: "office",
      includeRetirement: true,
    });

    expect(result.overheadRate).toBeCloseTo(0.187507, 6);
    expect(result.overheadRate).toBeLessThan(1);
  });

  // 회귀 방지: formatPercent가 내부에서 ×100을 하므로 호출부에서 또 곱하면 안 된다.
  // 과거 `formatPercent(overheadRate * 100)`으로 "+1875.1%"가 노출된 사고가 있었다.
  it("요약 타일의 급여 대비 비율은 formatPercent로 18.8%가 된다", () => {
    const result = ok({
      monthlySalary: 3_000_000,
      employeeCount: 1,
      industryKey: "office",
      includeRetirement: true,
    });

    expect(formatPercent(result.overheadRate, 1)).toBe("18.8%");
  });

  it("업종 산재요율도 비율이므로 formatPercent가 한 자리 퍼센트로 표기한다", () => {
    const office = INDUSTRY_ACCIDENT_RATES.find((r) => r.key === "office")!;
    const construction = INDUSTRY_ACCIDENT_RATES.find((r) => r.key === "construction")!;

    expect(formatPercent(office.rate, 1)).toBe("0.7%");
    expect(formatPercent(construction.rate, 1)).toBe("3.7%");
  });

  it("퇴직급여 미포함이면 적립분이 0이고 overheadRate가 낮아진다", () => {
    const withReserve = ok({
      monthlySalary: 3_000_000,
      employeeCount: 1,
      industryKey: "office",
      includeRetirement: true,
    });
    const without = ok({
      monthlySalary: 3_000_000,
      employeeCount: 1,
      industryKey: "office",
      includeRetirement: false,
    });

    expect(without.retirementReserve).toBe(0);
    expect(without.overheadRate).toBeLessThan(withReserve.overheadRate);
  });

  it("국민연금은 기준소득월액 상한(659만원)을 넘겨 부과하지 않는다", () => {
    const capped = ok({
      monthlySalary: 10_000_000,
      employeeCount: 1,
      industryKey: "office",
      includeRetirement: true,
    });

    expect(capped.employer.nationalPension).toBe(Math.round(6_590_000 * 0.0475));
  });
});
