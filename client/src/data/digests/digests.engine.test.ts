import { describe, expect, it } from "vitest";

import { calcBreakEven } from "@/utils/bizBreakEvenCalc";
import { calcCorpAfterTax, calcIndividualAfterTax } from "@/utils/bizCalc";
import { calcDeliveryFees } from "@/utils/bizDeliveryCalc";
import { calculateCarExpenseDeduction, calculateCorpTax, calculateMeetingCost } from "@/utils/bizExpansionCalc";
import { calcVatCompare } from "@/utils/bizVatCalc";
import { calculateLaborCost } from "@/utils/laborCostCalc";
import { calculateStandardExpenseRate } from "@/utils/standardExpenseRateCalc";
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
    expect(F.lead2).toBeCloseTo(-diff(IVC.preset2), 6);
    expect(F.lead4).toBeCloseTo(diff(IVC.preset4), 6);
    expect(diff(IVC.preset2, F.eFlip)).toBeLessThan(0);
    expect(diff(IVC.preset2, F.eFlip - IVC.expenseStep)).toBeGreaterThanOrEqual(0);
    for (let s = 0; s <= IVC.salaryMax; s += IVC.scanStep) {
      expect(calcCorpAfterTax(IVC.preset2, IVC.expenseRate, s).afterTaxIncome).toBeLessThanOrEqual(F.bestAfter);
    }
    expect(F.social2).toBeCloseTo(calcCorpAfterTax(IVC.preset2, IVC.expenseRate, IVC.salary).socialInsurance, 6);
    const cap = calcIndividualAfterTax(F.capTaxable / (1 - IVC.expenseRate), IVC.expenseRate);
    expect(F.capPension).toBeCloseTo(cap.nationalPension, 6);
    expect(F.doublePension).toBeCloseTo(F.capPension, 6);
    expect(F.divTax4).toBeCloseTo(calcCorpAfterTax(IVC.preset4, IVC.expenseRate, IVC.salary).dividendTax, 6);
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
    expect(F.ctTax).toBe(ok(calculateCorpTax({ taxableIncome: HOME.corpTaxable })).tax);
    expect(F.cafeBep).toBeCloseTo(calcBreakEven(HOME.cafeFixed, HOME.cafeVar, HOME.cafeDays).breakEvenRevenue, 6);
    const labor = ok(calculateLaborCost({ monthlySalary: HOME.laborSalary, employeeCount: HOME.headcount, industryKey: "retail", includeRetirement: true }));
    expect(F.laborTotal).toBe(labor.totalCostPerEmployee);
    expect(F.bestFee).toBeCloseTo(Math.min(...calcDeliveryFees(HOME.order, HOME.orders).map((r) => r.totalFee)), 6);
    expect(F.vatSimple).toBeCloseTo(calcVatCompare(HOME.vatRevenue, "food", HOME.vatPurchase).simplifiedVat, 6);
  });
});
