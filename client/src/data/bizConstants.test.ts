import { describe, expect, it } from "vitest";
import { CORP_TAX_BRACKETS, DELIVERY_APPS, SOCIAL_INSURANCE } from "@/data/bizConstants";
import { MINIMUM_MONTHLY_WAGE_2026, MINIMUM_WAGE_2026 } from "@/data/laborCost";

describe("2026 business policy constants", () => {
  it("2026년 최저임금을 반영한다", () => {
    expect(MINIMUM_WAGE_2026).toBe(10_320);
    expect(MINIMUM_MONTHLY_WAGE_2026).toBe(2_156_880);
  });

  it("2026년 법인세율과 국민연금 상한을 반영한다", () => {
    expect(CORP_TAX_BRACKETS.map((item) => item.rate)).toEqual([0.1, 0.2, 0.22, 0.25]);
    expect(SOCIAL_INSURANCE.nationalPension.upperLimit).toBe(6_590_000);
  });

  it("배달앱 비교값은 상생안 범위 안에 있다", () => {
    expect(DELIVERY_APPS.every((app) => app.commissionRate >= 0.02 && app.commissionRate <= 0.078)).toBe(true);
  });
});
