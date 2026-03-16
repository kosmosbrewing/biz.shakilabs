import { describe, expect, it } from "vitest";
import {
  formatNumber,
  formatWon,
  formatWonShort,
  formatPercent,
  formatCurrency,
} from "./utils";

describe("utils formatters", () => {
  it("formatNumber/formatWon은 nullish를 '-'로 처리한다", () => {
    expect(formatNumber(null)).toBe("-");
    expect(formatNumber(12345)).toBe("12,345");

    expect(formatWon(undefined)).toBe("-");
    expect(formatWon(12345.6)).toBe("12,346원");
  });

  it("formatWonShort는 만/억 단위를 축약한다", () => {
    expect(formatWonShort(2_490_000)).toBe("249만원");
    expect(formatWonShort(100_000_000)).toBe("1억원");
    expect(formatWonShort(123_400_000)).toBe("1억 2,340만원");
    expect(formatWonShort(-54_000)).toBe("-5만원");
  });

  it("formatPercent는 소수점 자릿수를 반영한다", () => {
    expect(formatPercent(0.1234)).toBe("12.3%");
    expect(formatPercent(0.1234, 2)).toBe("12.34%");
    expect(formatPercent(0.0099, 2)).toBe("0.99%");
    expect(formatPercent(null)).toBe("-");
  });

  it("formatCurrency는 통화 규칙에 맞게 표기한다", () => {
    expect(formatCurrency(14900, "KRW")).toContain("14,900");
    expect(formatCurrency(12.34, "USD")).toContain("12.34");
    expect(formatCurrency(undefined, "KRW")).toBe("-");
  });
});
