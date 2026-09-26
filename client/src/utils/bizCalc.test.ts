import { describe, expect, it } from "vitest";
import { calcCorpAfterTax, calcIndividualAfterTax } from "@/utils/bizCalc";

// 기대값은 bizConstants를 가져오지 않고 법령 수치를 직접 적는다 — 엔진과 같은 상수를 참조하면
// 상수가 틀려도 엔진과 테스트가 함께 움직여 항등식이 된다.
// - 국민연금 9.5%: 국민연금법 부칙 <제20903호, 2025.4.2.> 제4조 — 2026년 지역가입자 1천분의 95, 사업장 각 1만분의 475
// - 건강보험 7.19%: 국민건강보험법 시행령 제44조제1항 — 직장·지역 모두 1만분의 719
// - 장기요양 13.14%: 노인장기요양보험법 시행령 제4조(100만분의 9,448) ÷ 7.19% (법 제9조제1항, 다섯째자리 반올림)
// - 건강보험 월 상한: 보건복지부 고시 제2025-222호 제2조 — 직장 보수월액보험료 9,183,480원, 지역 4,591,740원
// - 국민연금 기준소득월액 상한 659만원: 보건복지부 고시 제2026-31호(2026.7.~2027.6.)
const PENSION_RATE = 0.095;
const HEALTH_RATE = 0.0719;
const LTC_RATIO = 0.1314;
const PENSION_BASE_CAP = 6_590_000;
const REGIONAL_HEALTH_CAP = 4_591_740;
const WORKPLACE_HEALTH_CAP = 9_183_480;

describe("개인사업자 본인 보험료 — 지역가입자는 근로자 몫(절반)이 아니라 전액을 낸다", () => {
  it("국민연금 = min(과세소득/12, 659만원) × 9.5% × 12 (상한 아래·위 모두)", () => {
    for (const [revenue, expenseRate] of [[50_000_000, 0.4], [100_000_000, 0.4], [300_000_000, 0.4], [80_000_000, 0.1]] as const) {
      const r = calcIndividualAfterTax(revenue, expenseRate);
      expect(r.nationalPension, `${revenue}/${expenseRate}`).toBeCloseTo(Math.min(r.taxableIncome / 12, PENSION_BASE_CAP) * PENSION_RATE * 12, 4);
    }
  });

  it("건강보험 = 과세소득 × 7.19%, 장기요양 = 건강보험 × 13.14% (월 상한 아래)", () => {
    for (const [revenue, expenseRate] of [[50_000_000, 0.4], [100_000_000, 0.4], [1_520_000_000, 0.5]] as const) {
      const r = calcIndividualAfterTax(revenue, expenseRate);
      expect(r.healthInsurance, `${revenue}`).toBeCloseTo(r.taxableIncome * HEALTH_RATE, 4);
      expect(r.longTermCare, `${revenue}`).toBeCloseTo(r.taxableIncome * HEALTH_RATE * LTC_RATIO, 4);
    }
  });

  it("건강보험은 지역가입자 월 상한 4,591,740원(연 55,100,880원)에서 멈추고 장기요양은 상한 뒤 금액에 붙는다", () => {
    // 과세소득 12억 — 요율대로면 연 8,628만원이지만 상한에 걸린다
    const capped = calcIndividualAfterTax(2_000_000_000, 0.4);
    expect(capped.taxableIncome).toBe(1_200_000_000);
    expect(capped.healthInsurance).toBeCloseTo(REGIONAL_HEALTH_CAP * 12, 4);
    expect(capped.longTermCare).toBeCloseTo(REGIONAL_HEALTH_CAP * 12 * LTC_RATIO, 4);
    // 과세소득 7.6억은 상한(약 7.66억) 바로 아래라 아직 요율 그대로
    const below = calcIndividualAfterTax(1_520_000_000, 0.5);
    expect(below.healthInsurance).toBeCloseTo(760_000_000 * HEALTH_RATE, 4);
    expect(below.healthInsurance).toBeLessThan(REGIONAL_HEALTH_CAP * 12);
  });

  it("고용·산재는 없다 — 총부담 = 소득세 + 지방소득세 + 국민연금 + 건강보험 + 장기요양", () => {
    const r = calcIndividualAfterTax(100_000_000, 0.4);
    expect(r.totalTax).toBeCloseTo(r.incomeTax + r.localTax + r.nationalPension + r.healthInsurance + r.longTermCare, 6);
  });
});

describe("법인 대표 급여 보험료 — 국민연금·건강보험(장기요양)만, 회사·대표 몫 합계", () => {
  it("socialInsurance = 국민연금 + 건강보험 + 장기요양 — 고용·산재가 끼지 않는다", () => {
    for (const salary of [0, 12_000_000, 36_000_000, 60_000_000, 120_000_000]) {
      const c = calcCorpAfterTax(100_000_000, 0.4, salary);
      const pension = Math.min(salary / 12, PENSION_BASE_CAP) * PENSION_RATE * 12;
      const health = salary * HEALTH_RATE;
      expect(c.nationalPension, `${salary}`).toBeCloseTo(pension, 4);
      expect(c.healthInsurance, `${salary}`).toBeCloseTo(health, 4);
      expect(c.longTermCare, `${salary}`).toBeCloseTo(health * LTC_RATIO, 4);
      expect(c.socialInsurance, `${salary}`).toBeCloseTo(pension + health + health * LTC_RATIO, 4);
    }
  });

  it("대표 급여 3,600만원의 보험료는 6,348,515.76원 — 고용 1.8%·산재 1.47%를 얹던 7,525,715.76원이 아니다", () => {
    // 국민연금 300만×9.5%×12 = 3,420,000 / 건강 3,600만×7.19% = 2,588,400 / 장기요양 2,588,400×13.14% = 340,115.76
    const c = calcCorpAfterTax(100_000_000, 0.4, 36_000_000);
    expect(c.socialInsurance).toBeCloseTo(3_420_000 + 2_588_400 + 340_115.76, 4);
  });

  it("건강보험은 직장가입자 보수월액보험료 상한 월 9,183,480원(회사·대표 몫 합계)에서 멈춘다", () => {
    const c = calcCorpAfterTax(5_000_000_000, 0.4, 2_000_000_000);
    expect(c.healthInsurance).toBeCloseTo(WORKPLACE_HEALTH_CAP * 12, 4);
    expect(c.longTermCare).toBeCloseTo(WORKPLACE_HEALTH_CAP * 12 * LTC_RATIO, 4);
  });
});

describe("기본값 손계산 — 매출 1억·경비율 40%·대표 급여 3,600만원", () => {
  it("개인 세후 39,915,140.4원, 법인 세후 44,925,294.24원 → 법인이 5,010,153.84원 유리", () => {
    // 개인(과세소득 6,000만): 소득세 6,000만×24%−576만 = 8,640,000, 지방소득세 864,000,
    //   국민연금 500만×9.5%×12 = 5,700,000, 건강 6,000만×7.19% = 4,314,000, 장기요양 4,314,000×13.14% = 566,859.6
    //   → 부담 20,084,859.6, 세후 39,915,140.4
    const ind = calcIndividualAfterTax(100_000_000, 0.4);
    expect(ind.totalTax).toBeCloseTo(8_640_000 + 864_000 + 5_700_000 + 4_314_000 + 566_859.6, 4);
    expect(ind.afterTaxIncome).toBeCloseTo(39_915_140.4, 4);
    // 법인(영업이익 6,000만): 과세표준 2,400만 → 법인세 2,400,000 + 지방 240,000,
    //   근로소득공제 750만+(3,600만−1,500만)×15% = 1,065만 → 과세 2,535만 → 소득세 2,535만×15%−126만 = 2,542,500, 지방 254,250,
    //   보험료 6,348,515.76, 배당 2,400만−264만 = 2,136만 × 15.4% = 3,289,440
    //   → 부담 15,074,705.76, 세후 44,925,294.24
    const corp = calcCorpAfterTax(100_000_000, 0.4, 36_000_000);
    expect(corp.totalTax).toBeCloseTo(2_400_000 + 240_000 + 2_542_500 + 254_250 + 6_348_515.76 + 3_289_440, 4);
    expect(corp.afterTaxIncome).toBeCloseTo(44_925_294.24, 4);
    expect(corp.afterTaxIncome - ind.afterTaxIncome).toBeCloseTo(5_010_153.84, 4);
  });
});
