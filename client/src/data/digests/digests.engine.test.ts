import { describe, expect, it } from "vitest";

import { calcBreakEven } from "@/utils/bizBreakEvenCalc";
import { calcCorpAfterTax, calcIndividualAfterTax } from "@/utils/bizCalc";
import { calcDeliveryFees } from "@/utils/bizDeliveryCalc";
import { calculateCarExpenseDeduction, calculateCorpTax, calculateMeetingCost } from "@/utils/bizExpansionCalc";
import { calcVatCompare } from "@/utils/bizVatCalc";
import { calculateLaborCost } from "@/utils/laborCostCalc";
import { calculateStandardExpenseRate } from "@/utils/standardExpenseRateCalc";
import { INCOME_TAX_BRACKETS, LOCAL_INCOME_TAX_RATE } from "../bizConstants";
import { INDUSTRY_EXPENSE_RATES } from "../standardExpenseRate";
import { BREAK_EVEN_DIGEST, BREAK_EVEN_INPUTS as BE } from "./breakEvenDigest";
import { CAR_DIGEST, CAR_INPUTS as CAR } from "./carDigest";
import { CORP_TAX_DIGEST, CORP_TAX_INPUTS as CT } from "./corpTaxDigest";
import { DELIVERY_DIGEST, DELIVERY_INPUTS as DF } from "./deliveryDigest";
import { EXPENSE_RATE_DIGEST, EXPENSE_RATE_INPUTS as ER } from "./expenseRateDigest";
import { HOME_DIGEST, HOME_INPUTS as HOME } from "./homeDigest";
import { IVC_DIGEST, IVC_INPUTS as IVC } from "./ivcDigest";
import { LABOR_DIGEST, LABOR_INPUTS as LC } from "./laborDigest";
import { MEETING_DIGEST, MEETING_INPUTS as MT } from "./meetingDigest";
import { VAT_DIGEST, VAT_INPUTS as VAT } from "./vatDigest";

// card cardInsights.test.ts와 같은 규율: 산문이 인용한 핵심 수치(경계·차액·역전점)를 여기서 엔진으로
// 다시 계산해 대조한다. 다이제스트 모듈이 값을 만드는 경로와 무관하게, 라이브 계산기와 모순이 생기면 여기서 깨진다.
// 경계값은 "그 지점에서는 성립하고 한 칸 아래에서는 성립하지 않는다"로 양쪽을 조인다.
const ok = <T,>(r: { success: true; data: T } | { success: false }): T => {
  if (!r.success) throw new Error("engine failed");
  return r.data;
};

describe("파생 다이제스트 — 인용 수치는 엔진 재계산과 일치한다", () => {
  it("/individual-vs-corp: 역전 매출·경비율 경계·최적 급여·연금 상한", () => {
    const F = IVC_DIGEST.facts;
    const diff = (r: number, e = IVC.expenseRate, s = IVC.salary) => calcCorpAfterTax(r, e, s).afterTaxIncome - calcIndividualAfterTax(r, e).afterTaxIncome;
    expect(diff(F.cross)).toBeGreaterThan(0);
    expect(diff(F.cross - IVC.scanStep)).toBeLessThanOrEqual(0);
    // "그 뒤로는 다시 뒤집히지 않습니다"·"멀어질수록 격차가 한쪽으로만 벌어지는 구조" — 스캔 전 구간에서 격차(법인−개인)가 줄지 않는다
    const shrinks: number[] = [];
    for (let r = IVC.scanStep, prev = -Infinity; r <= IVC.scanMax; r += IVC.scanStep) {
      const d = diff(r);
      if (d < prev) shrinks.push(r);
      prev = d;
    }
    expect(shrinks).toEqual([]);
    // 프리셋 부호 — 산문은 "개인이 앞서는 것은 1번뿐, 2~4번은 법인"이라고 쓴다(lead는 앞서는 쪽의 양수 격차)
    expect(F.lead1).toBeGreaterThan(0);
    expect(F.lead1).toBeCloseTo(-diff(IVC.preset1), 6);
    for (const [lead, preset] of [[F.lead2, IVC.preset2], [F.lead3, IVC.preset3], [F.lead4, IVC.preset4]] as const) {
      expect(lead).toBeGreaterThan(0);
      expect(lead).toBeCloseTo(diff(preset), 6);
    }
    expect(IVC.preset1).toBeLessThan(F.cross);
    expect(F.cross).toBeLessThanOrEqual(IVC.preset2);
    // 경비율: eFlipPrev까지 전부 법인, eFlip부터 80%까지 전부 개인 — 기본 경비율 40%는 법인 쪽
    const steps = Math.round((IVC.expenseMax - IVC.expenseMin) / IVC.expenseStep);
    for (let k = 0; k <= steps; k += 1) {
      const e = Number((IVC.expenseMin + k * IVC.expenseStep).toFixed(2));
      if (e < F.eFlip) expect(diff(IVC.preset2, e), `경비율 ${e}`).toBeGreaterThan(0);
      else expect(diff(IVC.preset2, e), `경비율 ${e}`).toBeLessThan(0);
    }
    expect(diff(IVC.preset2)).toBeGreaterThan(0);
    expect(F.expenseMargin).toBeGreaterThan(0);
    // 최적 급여 — 그 급여까지는 세후가 오르고 그 위로는 내려간다(산문: "그 위로는 급여를 올릴수록 줄어든다")
    for (let s = 0; s <= IVC.salaryMax; s += IVC.scanStep) {
      const at = calcCorpAfterTax(IVC.preset2, IVC.expenseRate, s).afterTaxIncome;
      expect(at).toBeLessThanOrEqual(F.bestAfter);
      if (s === 0) continue;
      const before = calcCorpAfterTax(IVC.preset2, IVC.expenseRate, s - IVC.scanStep).afterTaxIncome;
      if (s <= F.bestSalary) expect(at, `급여 ${s}`).toBeGreaterThan(before);
      else expect(at, `급여 ${s}`).toBeLessThan(before);
    }
    expect(F.social2).toBeCloseTo(calcCorpAfterTax(IVC.preset2, IVC.expenseRate, IVC.salary).socialInsurance, 6);
    // "보험료는 개인사업자 쪽이 더 큽니다" — 지역가입자 보험료가 법인 대표 급여 보험료보다 크다
    expect(F.insGap2).toBeGreaterThan(0);
    expect(F.insGap2).toBeCloseTo(F.indIns2 - F.social2, 6);
    // 세율 역전보다 경계가 먼저 온다: 경계의 개인 과세소득이 5,000만원 구간 아래이고, 그 국면에서는 법인세·배당이 0이라
    // 승부가 "개인 세금·보험료 > 급여 고정비"로만 갈린다
    expect(F.crossProfit).toBeLessThan(IVC.indMidMin);
    const atCross = calcCorpAfterTax(F.cross, IVC.expenseRate, IVC.salary);
    expect(atCross.corpTax + atCross.dividendTax).toBe(0);
    expect(calcIndividualAfterTax(F.cross, IVC.expenseRate).totalTax).toBeGreaterThan(F.fixedCorpCost);
    expect(calcIndividualAfterTax(F.cross - IVC.scanStep, IVC.expenseRate).totalTax).toBeLessThanOrEqual(F.fixedCorpCost);
    // h2 "개인 한계세율은 과세표준 5,000만원부터 앞의 것(배당 경로 저구간)을 넘는다" — 바로 아래 구간은 못 넘는다
    expect(INCOME_TAX_BRACKETS[1].rate * (1 + LOCAL_INCOME_TAX_RATE)).toBeLessThan(F.routeLow);
    expect(F.indMid).toBeGreaterThan(F.routeLow);
    expect(INCOME_TAX_BRACKETS[2].min).toBe(IVC.indMidMin);
    const cap = calcIndividualAfterTax(F.capTaxable / (1 - IVC.expenseRate), IVC.expenseRate);
    expect(F.capPension).toBeCloseTo(cap.nationalPension, 6);
    expect(F.doublePension).toBeCloseTo(F.capPension, 6);
    // 건강보험 상한: 그 과세소득 위로는 멈추고 아래에서는 아직 자라며, 매출 스캔 범위 안에서 걸린다
    const healthAt = (taxable: number) => calcIndividualAfterTax(taxable / (1 - IVC.expenseRate), IVC.expenseRate).healthInsurance;
    expect(healthAt(F.healthCapTaxable * 1.01)).toBeCloseTo(IVC.healthCapMonthly * 12, 4);
    expect(healthAt(F.healthCapTaxable * 2)).toBeCloseTo(IVC.healthCapMonthly * 12, 4);
    expect(healthAt(F.healthCapTaxable * 0.99)).toBeLessThan(IVC.healthCapMonthly * 12);
    expect(F.doubleHealth).toBeCloseTo(F.capHealth * 2, 6);
    expect(F.capTaxableDouble).toBeLessThan(F.healthCapTaxable);
    expect(F.healthCapRevenue).toBeLessThan(IVC.scanMax);
    expect(F.divTax4).toBeCloseTo(calcCorpAfterTax(IVC.preset4, IVC.expenseRate, IVC.salary).dividendTax, 6);
    // "순서가 뒤집힙니다" — 5천만원에서는 개인 부담률이 낮고 5억원에서는 법인 부담률이 낮다
    expect(F.indBurden1).toBeLessThan(F.corpBurden1);
    expect(F.indBurden4).toBeGreaterThan(F.corpBurden4);
    // "배당소득세가 법인세·지방소득세와 맞먹습니다" — 어느 쪽이 크다고 쓰지 않으므로 10% 안에서만 허용한다
    // (이전 산문은 3,510만원이 3,608만원"보다 크다"고 써서 부등호가 반대였다)
    expect(Math.abs(F.divTax4 / F.corpTaxAll4 - 1)).toBeLessThan(0.1);
    // "배당에 붙는 건강보험료가 빠져 있어 실제로 다 꺼내면 이보다 줄어든다" — 5억원 프리셋의 배당은 보수 외 소득 기준을 넘는다
    expect(F.div4).toBeGreaterThan(IVC.dividendHealthThreshold);
    // 금융소득종합과세 한계 문장도 같은 프리셋에서 실제로 해당될 때만 의미가 있다
    expect(F.div4).toBeGreaterThan(IVC.financialIncomeTaxThreshold);
  });

  it("/corp-tax: 세액·실효세율 경계·세후 목표 역산·두 엔진 일치", () => {
    const F = CORP_TAX_DIGEST.facts;
    const run = (t: number) => ok(calculateCorpTax({ taxableIncome: t }));
    expect(F.tax).toBe(run(CT.defaultTaxable).tax);
    expect(F.eff).toBeCloseTo(run(CT.defaultTaxable).effectiveRate, 9);
    expect(run(F.eff20).effectiveRate).toBeGreaterThanOrEqual(CT.effTarget);
    expect(run(F.eff20 - CT.scanStep).effectiveRate).toBeLessThan(CT.effTarget);
    expect(run(F.netGross).afterTaxIncome).toBeGreaterThanOrEqual(CT.netTarget);
    expect(run(F.netGross - CT.fineStep).afterTaxIncome).toBeLessThan(CT.netTarget);
    const other = calcCorpAfterTax(CT.defaultTaxable, 0, 0);
    expect(other.corpTax + other.corpLocalTax).toBeCloseTo(F.tax, 6);
    expect(F.indTax).toBe(ok(calculateStandardExpenseRate({ revenue: CT.defaultTaxable, standardRate: 0, simpleRate: 0, purchaseCost: 0, rentCost: 0, laborCost: 0 })).standard.totalTax);
    expect(F.b3Eff).toBeCloseTo(run(CT.bracket3).effectiveRate, 9);
  });

  it("/vat-compare: 역전 매입 비율·면제선·상한 절벽·임대업 빈 창", () => {
    const F = VAT_DIGEST.facts;
    for (const [key, flip] of [["retail", F.flipRetail], ["manufacturing", F.flipManufacturing], ["service", F.flipService]] as const) {
      expect(calcVatCompare(VAT.defaultRevenue, key, flip).recommendation).toBe("general");
      expect(calcVatCompare(VAT.defaultRevenue, key, flip - VAT.purchaseStep).recommendation).toBe("simplified");
      expect(calcVatCompare(VAT.presetA, key, flip - VAT.purchaseStep).recommendation).toBe("simplified");
    }
    expect(F.atExemptSimplified).toBeCloseTo(calcVatCompare(VAT.exemptThreshold, "food", VAT.defaultPurchase).simplifiedVat, 6);
    expect(F.underExemptSimplified).toBe(0);
    const under = calcVatCompare(VAT.eligibilityThreshold - VAT.fineStep, "food", VAT.defaultPurchase);
    const at = calcVatCompare(VAT.eligibilityThreshold, "food", VAT.defaultPurchase);
    expect(under.isSimplifiedEligible).toBe(true);
    expect(at.isSimplifiedEligible).toBe(false);
    expect(F.ceilJump).toBeCloseTo(at.generalVat - under.simplifiedVat, 6);
    const re = calcVatCompare(VAT.specialThreshold, "realestate", VAT.defaultPurchase);
    expect(re.isSimplifiedEligible).toBe(false);
    expect(F.reAtSimplified).toBeCloseTo(re.simplifiedVat, 6);
  });

  it("/labor-cost: 인건비·부담률 고정·건보>연금 교차점·산재 차이", () => {
    const F = LABOR_DIGEST.facts;
    const run = (s: number, k = "office", ret = true) => ok(calculateLaborCost({ monthlySalary: s, employeeCount: 1, industryKey: k, includeRetirement: ret }));
    expect(F.total).toBe(run(LC.defaultSalary).totalCostPerEmployee);
    expect(F.overhead).toBeCloseTo(run(LC.pensionCap).overheadRate, 4);
    const at = run(F.cross).employer;
    const before = run(F.cross - LC.scanStep).employer;
    expect(at.healthInsurance + at.longTermCare).toBeGreaterThan(at.nationalPension);
    expect(before.healthInsurance + before.longTermCare).toBeLessThanOrEqual(before.nationalPension);
    expect(F.insGap).toBe(run(LC.defaultSalary).employer.industrialAccident);
    expect(F.constructionGap).toBe(run(LC.defaultSalary, "construction").totalCostPerEmployee - F.total);
    expect(F.noRetireOverhead).toBeCloseTo(run(LC.defaultSalary, "office", false).overheadRate, 9);
  });

  it("/break-even: 업종별 BEP·민감도·단위 배율·안전한계율", () => {
    const F = BREAK_EVEN_DIGEST.facts;
    expect(F.foodBep).toBeCloseTo(calcBreakEven(BE.fixed, BE.varFood, BE.days).breakEvenRevenue, 6);
    expect(F.highBep).toBeCloseTo(calcBreakEven(BE.fixed, BE.varRetail, BE.days).breakEvenRevenue, 6);
    expect(F.varUpGain).toBeGreaterThan(F.fixedUpGain);
    expect(F.unitRetail).toBeCloseTo(calcBreakEven(BE.unit, BE.varRetail, BE.days).breakEvenRevenue, 6);
    expect(F.safetyFood).toBeCloseTo(1 - calcBreakEven(BE.typicalRevenue * BE.fixedFood, BE.varFood, BE.days).breakEvenRevenue / BE.typicalRevenue, 9);
    expect(F.daily30).toBeCloseTo(calcBreakEven(BE.fixed, BE.varFood, BE.days30).dailyBreakEvenRevenue, 6);
  });

  it("/delivery-fee: 순위 불변·교차점·월 격차", () => {
    const F = DELIVERY_DIGEST.facts;
    let prev = "";
    for (let a = DF.scanMin; a <= DF.scanMax; a += DF.scanStep) {
      const order = calcDeliveryFees(a, 1).slice().sort((x, y) => x.totalFee - y.totalFee).map((r) => r.appKey).join("<");
      if (prev) expect(order).toBe(prev);
      prev = order;
    }
    expect(F.rankChanges).toBe(0);
    const c = (a: number) => calcDeliveryFees(a, 1).find((r) => r.appKey === "coupangeats")!;
    expect(c(F.meetCoupang).commission).toBeGreaterThanOrEqual(c(F.meetCoupang).deliveryFee);
    expect(c(F.meetCoupang - DF.scanStep).commission).toBeLessThan(c(F.meetCoupang - DF.scanStep).deliveryFee);
    const d = calcDeliveryFees(DF.defaultOrder, DF.defaultOrders);
    expect(F.monthlyGap).toBeCloseTo(d.find((r) => r.appKey === "baemin")!.totalFee - d.find((r) => r.appKey === "coupangeats")!.totalFee, 6);
  });

  it("/car-expense: 절세액·지방소득세 차액·한도 도달 차량비", () => {
    const F = CAR_DIGEST.facts;
    const run = (c: number, u: number, t: number) => ok(calculateCarExpenseDeduction({ annualCost: c, businessUseRate: u, taxRate: t }));
    expect(F.saving).toBe(run(CAR.defaultCost, CAR.defaultUse, CAR.defaultRate).taxSaving);
    expect(F.localGap).toBe(run(CAR.defaultCost, CAR.defaultUse, CAR.defaultRate * (1 + CAR.localSurtax)).taxSaving - F.saving);
    expect(run(F.limitCost, CAR.defaultUse, CAR.defaultRate).deductibleAmount).toBeGreaterThanOrEqual(CAR.faqLimit);
    expect(run(F.limitCost - CAR.costStep, CAR.defaultUse, CAR.defaultRate).deductibleAmount).toBeLessThan(CAR.faqLimit);
    expect(F.altSaving).toBe(F.savingUseMax);
  });

  it("/meeting-cost: 매입세액·대칭 절감·최저임금 환산", () => {
    const F = MEETING_DIGEST.facts;
    const d = ok(calculateMeetingCost({ attendees: MT.attendees, costPerPerson: MT.costPerPerson, meetingsPerMonth: MT.meetingsPerMonth, months: MT.months, vatIncluded: true }));
    expect(F.vat).toBe(d.vatCredit);
    expect(F.annual).toBe(d.annualBudget);
    expect(F.cheaperAnnual).toBe(F.fewerAnnual);
    expect(F.minWageMonths).toBeCloseTo(d.annualBudget / MT.minimumMonthly, 9);
  });

  it("/standard-expense-rate: 세금 차이·매출 역전점·단순경비율 승수", () => {
    const F = EXPENSE_RATE_DIGEST.facts;
    const it = INDUSTRY_EXPENSE_RATES.find((i) => i.key === "it")!;
    const run = (r: number) => ok(calculateStandardExpenseRate({ revenue: r, standardRate: it.standardRate, simpleRate: it.simpleRate, purchaseCost: ER.purchase, rentCost: ER.rent, laborCost: ER.labor }));
    expect(F.diff).toBe(-run(ER.revenue).taxDifference);
    expect(run(F.flip).recommendation).toBe("simple");
    expect(run(F.flip - ER.scanStep).recommendation).toBe("standard");
    const wins = INDUSTRY_EXPENSE_RATES.filter((i) =>
      ok(calculateStandardExpenseRate({ revenue: ER.revenue, standardRate: i.standardRate, simpleRate: i.simpleRate, purchaseCost: ER.purchase, rentCost: ER.rent, laborCost: ER.labor })).recommendation === "simple",
    ).length;
    expect(F.simpleWins).toBe(wins);
    expect(F.overThreshold).toBe(INDUSTRY_EXPENSE_RATES.filter((i) => ER.revenue > i.simpleThreshold * ER.manwonUnit).length);
  });

  it("/: 교차 도구 수치", () => {
    const F = HOME_DIGEST.facts;
    expect(F.gap).toBeCloseTo(calcCorpAfterTax(HOME.revenue, HOME.expenseRate, HOME.salary).afterTaxIncome - calcIndividualAfterTax(HOME.revenue, HOME.expenseRate).afterTaxIncome, 6);
    // "격차의 출처는 세율이 아니라 보험료" — 세금만 합치면 법인 경로가 더 내고, 보험료 차이가 격차보다 크다
    expect(F.taxGap).toBeGreaterThan(0);
    expect(F.insGap).toBeGreaterThan(F.gap);
    expect(F.gap).toBeCloseTo(F.insGap - F.taxGap, 6);
    expect(F.ctTax).toBe(ok(calculateCorpTax({ taxableIncome: HOME.corpTaxable })).tax);
    expect(F.cafeBep).toBeCloseTo(calcBreakEven(HOME.cafeFixed, HOME.cafeVar, HOME.cafeDays).breakEvenRevenue, 6);
    const labor = ok(calculateLaborCost({ monthlySalary: HOME.laborSalary, employeeCount: HOME.headcount, industryKey: "retail", includeRetirement: true }));
    expect(F.laborTotal).toBe(labor.totalCostPerEmployee);
    expect(F.bestFee).toBeCloseTo(Math.min(...calcDeliveryFees(HOME.order, HOME.orders).map((r) => r.totalFee)), 6);
    expect(F.vatSimple).toBeCloseTo(calcVatCompare(HOME.vatRevenue, "food", HOME.vatPurchase).simplifiedVat, 6);
  });
});
