import { describe, expect, it } from "vitest";
import { calcVatCompare } from "./bizVatCalc";

describe("calcVatCompare", () => {
  it("음식점업 부가가치율 15%를 적용한다", () => {
    const result = calcVatCompare(80_000_000, "food", 0.4);

    expect(result.simplifiedVat).toBe(1_200_000);
    expect(result.recommendation).toBe("simplified");
  });

  it("부동산임대업은 4,800만원 이상이면 간이과세 대상에서 제외한다", () => {
    const result = calcVatCompare(60_000_000, "realestate", 0.4);

    expect(result.simplifiedThreshold).toBe(48_000_000);
    expect(result.isSimplifiedEligible).toBe(false);
  });

  it("간이과세 납부면제 구간은 간이과세 부가세를 0원으로 처리한다", () => {
    const result = calcVatCompare(40_000_000, "service", 0.3);

    expect(result.isSimplifiedExempt).toBe(true);
    expect(result.simplifiedVat).toBe(0);
  });
});
