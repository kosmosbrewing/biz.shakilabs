// / (홈) 파생 다이제스트 — 홈은 아홉 계산기의 입구라 어느 한 엔진의 페이지가 아니다. 여기는 아홉 엔진을
// 각 도구 페이지가 쓰지 않는 입력으로 한 번씩 돌려, 도구 사이를 가로지르는 발견을 적는다: 같은 이익에
// 붙는 개인·법인 세금, 부가세 면제선이 손익분기점과 만나는 자리, 급여 1원의 사업주 비용이 회의비·차량비와
// 얽히는 방식. 도구 페이지 다이제스트와 같은 숫자를 반복하지 않도록 입력을 전부 다르게 잡았다("가정").
// 산문의 숫자는 F·I에서만 온다.

import { INDUSTRY_EXPENSE_RATIOS } from "../bizConstants";
import { INDUSTRY_EXPENSE_RATES } from "../standardExpenseRate";
import { calcCorpAfterTax, calcIndividualAfterTax } from "@/utils/bizCalc";
import { calcBreakEven } from "@/utils/bizBreakEvenCalc";
import { calcDeliveryFees } from "@/utils/bizDeliveryCalc";
import { calculateCarExpenseDeduction, calculateCorpTax, calculateMeetingCost } from "@/utils/bizExpansionCalc";
import { calcVatCompare } from "@/utils/bizVatCalc";
import { calculateLaborCost } from "@/utils/laborCostCalc";
import { calculateStandardExpenseRate } from "@/utils/standardExpenseRateCalc";
import { type Digest, manwon, num, pct, times, won } from "./format";

// 홈 전용 가정값 — 도구 페이지 기본값과 전부 다르게 잡아 같은 숫자가 두 페이지에 실리지 않게 한다
export const HOME_INPUTS = {
  revenue: 150_000_000,
  expenseRate: 0.5,
  salary: 24_000_000,
  corpTaxable: 300_000_000,
  vatRevenue: 60_000_000,
  vatPurchase: 0.3,
  laborSalary: 2_500_000,
  headcount: 3,
  cafeFixed: 3_000_000,
  cafeDays: 28,
  cafeVar: INDUSTRY_EXPENSE_RATIOS.cafe.variableRatio,
  order: 25_000,
  orders: 300,
  carCost: 10_000_000,
  carUse: 0.7,
  carRate: 0.165,
  attendees: 8,
  perHead: 20_000,
  meetings: 2,
  months: 12,
  serRevenue: 60_000_000,
  serPurchase: 5_000_000,
  serRent: 8_000_000,
  serLabor: 0,
  retailStandard: INDUSTRY_EXPENSE_RATES.find((i) => i.key === "retail")!.standardRate / 100,
  retailSimple: INDUSTRY_EXPENSE_RATES.find((i) => i.key === "retail")!.simpleRate / 100,
  vatExempt: 48_000_000,
  fineStep: 10_000,
};
const I = HOME_INPUTS;
const ok = <T,>(r: { success: true; data: T } | { success: false }): T => {
  if (!r.success) throw new Error("home digest engine failed");
  return r.data;
};

function facts() {
  const ind = calcIndividualAfterTax(I.revenue, I.expenseRate);
  const corp = calcCorpAfterTax(I.revenue, I.expenseRate, I.salary);
  const ct = ok(calculateCorpTax({ taxableIncome: I.corpTaxable }));
  const indOnTaxable = ok(calculateStandardExpenseRate({ revenue: I.corpTaxable, standardRate: 0, simpleRate: 0, purchaseCost: 0, rentCost: 0, laborCost: 0 }));
  const vat = calcVatCompare(I.vatRevenue, "food", I.vatPurchase);
  const vatExempt = calcVatCompare(I.vatExempt - I.fineStep, "food", I.vatPurchase);
  const labor = ok(calculateLaborCost({ monthlySalary: I.laborSalary, employeeCount: I.headcount, industryKey: "retail", includeRetirement: true }));
  const cafe = calcBreakEven(I.cafeFixed, I.cafeVar, I.cafeDays);
  const cafeWithLabor = calcBreakEven(I.cafeFixed + labor.totalCostPerEmployee, I.cafeVar, I.cafeDays);
  const cafeWithSalary = calcBreakEven(I.cafeFixed + I.laborSalary, I.cafeVar, I.cafeDays);
  const delivery = calcDeliveryFees(I.order, I.orders);
  const best = delivery.slice().sort((a, b) => a.totalFee - b.totalFee)[0];
  const worst = delivery.slice().sort((a, b) => b.totalFee - a.totalFee)[0];
  const cafeDelivery = calcBreakEven(I.cafeFixed, I.cafeVar + best.feeRate, I.cafeDays);
  const car = ok(calculateCarExpenseDeduction({ annualCost: I.carCost, businessUseRate: I.carUse, taxRate: I.carRate }));
  const meeting = ok(calculateMeetingCost({ attendees: I.attendees, costPerPerson: I.perHead, meetingsPerMonth: I.meetings, months: I.months, vatIncluded: true }));
  const ser = ok(calculateStandardExpenseRate({ revenue: I.serRevenue, standardRate: I.retailStandard * 100, simpleRate: I.retailSimple * 100, purchaseCost: I.serPurchase, rentCost: I.serRent, laborCost: I.serLabor }));
  const serVat = calcVatCompare(I.serRevenue, "retail", I.serPurchase / I.serRevenue);
  return {
    profit: ind.taxableIncome, indTax: ind.totalTax, corpTotal: corp.totalTax, indAfter: ind.afterTaxIncome, corpAfter: corp.afterTaxIncome,
    gap: corp.afterTaxIncome - ind.afterTaxIncome, indRate: ind.totalTax / ind.taxableIncome, corpRate: corp.totalTax / corp.operatingProfit,
    corpSocial: corp.socialInsurance, corpDividendTax: corp.dividendTax, corpCorpTax: corp.corpTax + corp.corpLocalTax,
    ctTax: ct.tax, ctEff: ct.effectiveRate, indOnTaxableTax: indOnTaxable.standard.totalTax, indOnTaxableEff: indOnTaxable.standard.effectiveRate,
    ctGap: indOnTaxable.standard.totalTax - ct.tax, ctRatio: indOnTaxable.standard.totalTax / ct.tax,
    vatGeneral: vat.generalVat, vatSimple: vat.simplifiedVat, vatGap: vat.difference, vatExemptGeneral: vatExempt.generalVat,
    vatPerMonth: vat.simplifiedVat / 12, cafeBepYear: cafe.breakEvenRevenue * 12, serPurchaseShare: I.serPurchase / I.serRevenue,
    laborTotal: labor.totalCostPerEmployee, laborMonthly: labor.totalMonthlyCost, laborAnnual: labor.totalAnnualCost, laborOverhead: labor.overheadRate,
    laborExtra: labor.totalCostPerEmployee - I.laborSalary, laborNet: labor.employeeNetPay,
    cafeBep: cafe.breakEvenRevenue, cafeDaily: cafe.dailyBreakEvenRevenue, cafeWithLabor: cafeWithLabor.breakEvenRevenue, cafeWithSalary: cafeWithSalary.breakEvenRevenue,
    cafeLaborGap: cafeWithLabor.breakEvenRevenue - cafeWithSalary.breakEvenRevenue, cafeLaborLift: cafeWithLabor.breakEvenRevenue - cafe.breakEvenRevenue,
    bestFee: best.totalFee, bestRate: best.feeRate, worstFee: worst.totalFee, worstRate: worst.feeRate, deliveryRevenue: I.order * I.orders,
    cafeDeliveryBep: cafeDelivery.breakEvenRevenue, cafeDeliveryLift: cafeDelivery.breakEvenRevenue - cafe.breakEvenRevenue, cafeDeliveryVar: I.cafeVar + best.feeRate,
    carDeductible: car.deductibleAmount, carSaving: car.taxSaving, carNon: car.nonDeductibleAmount, carSavingShare: car.taxSaving / I.carCost,
    meetingAnnual: meeting.annualBudget, meetingVat: meeting.vatCredit, meetingPerPerson: meeting.annualPerPerson,
    meetingVsLabor: meeting.annualBudget / labor.totalCostPerEmployee, carVsMeeting: car.taxSaving / meeting.vatCredit,
    serStd: ser.standard.totalTax, serSimp: ser.simple.totalTax, serDiff: ser.taxDifference, serStdTaxable: ser.standard.taxableIncome, serSimpTaxable: ser.simple.taxableIncome,
    serMajorsShare: (I.serPurchase + I.serRent + I.serLabor) / I.serRevenue, serThreshold: I.retailSimple - I.retailStandard,
    serVatGeneral: serVat.generalVat, serVatSimple: serVat.simplifiedVat, serTaxPlusVat: ser.standard.totalTax + serVat.generalVat,
    serSimpPlusVat: ser.simple.totalTax + serVat.simplifiedVat, serCombinedGap: ser.standard.totalTax + serVat.generalVat - ser.simple.totalTax - serVat.simplifiedVat,
  };
}
const F = facts();
const BEST = calcDeliveryFees(I.order, I.orders).slice().sort((a, b) => a.totalFee - b.totalFee)[0].appName;
const WORST = calcDeliveryFees(I.order, I.orders).slice().sort((a, b) => b.totalFee - a.totalFee)[0].appName;

export const HOME_DIGEST: Digest = {
  facts: F,
  inputs: I,
  findings: [
    {
      h2: `영업이익 ${manwon(F.profit)}에 붙는 부담은 개인 ${manwon(F.indTax)} 대 법인 ${manwon(F.corpTotal)} — 격차 ${manwon(F.gap)}의 출처는 세율이 아니라 배당과 보험료`,
      body:
        `매출 ${manwon(I.revenue)}·경비율 ${pct(I.expenseRate)}·대표 급여 ${manwon(I.salary)}을 가정해 개인 vs 법인 엔진을 돌리면 영업이익 ${manwon(F.profit)}에서 개인사업자는 세금과 보험료로 ${won(F.indTax)}(이익의 ${pct(F.indRate, 1)}), 법인 경로는 ${won(F.corpTotal)}(${pct(F.corpRate, 1)})을 냅니다. ` +
        `법인 쪽 합계를 뜯으면 법인세·지방소득세는 ${won(F.corpCorpTax)}에 그치고 배당소득세 ${won(F.corpDividendTax)}, 급여의 4대보험 ${won(F.corpSocial)}이 나머지를 채웁니다. ` +
        `세후소득은 개인 ${manwon(F.indAfter)}, 법인 ${manwon(F.corpAfter)}으로 법인이 ${manwon(F.gap)} 많습니다. 법인세율이 낮아서가 아니라 개인 누진세율 구간이 배당 경로의 합산 세율보다 높아진 자리이기 때문입니다. ` +
        `개인 vs 법인 비교 페이지는 이 경계가 어느 매출에서 열리는지를 전 구간 스캔으로 보여줍니다.`,
    },
    {
      h2: `과세표준 ${manwon(I.corpTaxable)}을 법인으로 내면 ${manwon(F.ctTax)}, 종합소득으로 내면 ${manwon(F.indOnTaxableTax)} — ${times(F.indOnTaxableTax, F.ctTax)}`,
      body:
        `법인세 계산기에 ${manwon(I.corpTaxable)}을 넣으면 지방소득세 포함 ${won(F.ctTax)}, 실효세율 ${pct(F.ctEff, 2)}입니다. 같은 금액을 기준경비율 계산기의 소득세 엔진에 경비 0으로 넣어 종합소득 과세표준으로 만들면 ${won(F.indOnTaxableTax)}, 실효세율 ${pct(F.indOnTaxableEff, 1)}입니다. ` +
        `차이 ${won(F.ctGap)}은 법인이 이익을 회사에 남겨 두는 동안만 유효한 유예이고, 배당으로 꺼내는 순간 배당소득세가 그 일부를 되찾아 갑니다. ` +
        `두 계산기가 같은 앱의 다른 엔진인데도 같은 과세표준에서 ${times(F.indOnTaxableTax, F.ctTax)}가 벌어지는 것은 세율표가 다르기 때문이지 산식이 다르기 때문이 아닙니다. ` +
        `이 격차를 실제 유불리로 바꾸려면 첫 발견처럼 급여·보험료·배당을 한 표에 넣어야 하고, 그 표가 개인 vs 법인 비교 페이지입니다.`,
    },
    {
      h2: `음식점 매출 ${manwon(I.vatRevenue)}·매입 ${pct(I.vatPurchase)}의 부가세는 일반 ${won(F.vatGeneral)} 대 간이 ${won(F.vatSimple)} — 면제선 ${manwon(I.vatExempt)} 아래였다면 0원 대 ${won(F.vatExemptGeneral)}`,
      body:
        `부가세 비교 엔진에 음식점·연 매출 ${manwon(I.vatRevenue)}·매입 비율 ${pct(I.vatPurchase)}를 가정해 넣으면 일반과세 ${won(F.vatGeneral)}, 간이과세 ${won(F.vatSimple)}으로 연 ${won(F.vatGap)} 차이가 납니다. 간이과세 부가세는 월 ${won(F.vatPerMonth)}꼴입니다. ` +
        `매출이 면제선 ${manwon(I.vatExempt)} 바로 아래였다면 간이과세는 0원인데 일반과세는 여전히 ${won(F.vatExemptGeneral)}이라, 면제 구간에서 두 과세 유형의 격차가 가장 큽니다. ` +
        `손익분기점 계산기에서 카페 고정비 ${manwon(I.cafeFixed)}·변동비율 ${pct(I.cafeVar)}의 월 손익분기 매출은 ${won(F.cafeBep)}, 연으로 ${manwon(F.cafeBepYear)}이라 면제선 ${manwon(I.vatExempt)}에 가깝습니다. ` +
        `손익분기점을 넘기는 첫해가 부가세 면제를 잃는 해와 겹치는 구조이며, 두 계산기를 같이 놓아야 그 겹침이 보입니다.`,
    },
    {
      h2: `급여 ${manwon(I.laborSalary)} 직원 한 명의 사업주 비용 ${won(F.laborTotal)}을 고정비에 넣으면 카페 손익분기점이 ${won(F.cafeLaborLift)} 오른다 — 세전 급여만 넣은 것보다 ${won(F.cafeLaborGap)} 더`,
      body:
        `인건비 계산기에 급여 ${manwon(I.laborSalary)}·도소매·음식숙박업·퇴직급여 포함을 넣으면 1인 월 인건비는 ${won(F.laborTotal)}, 급여 대비 추가 부담률 ${pct(F.laborOverhead, 2)}, 급여 위에 ${won(F.laborExtra)}이 얹힙니다. 직원의 실수령은 소득세 전 ${won(F.laborNet)}입니다. ` +
        `이 금액을 손익분기점 계산기의 고정비 ${manwon(I.cafeFixed)}(카페·변동비율 ${pct(I.cafeVar)})에 더하면 월 손익분기 매출은 ${won(F.cafeBep)}에서 ${won(F.cafeWithLabor)}으로 ${won(F.cafeLaborLift)} 오릅니다. ` +
        `세전 급여 ${manwon(I.laborSalary)}만 더했을 때의 ${won(F.cafeWithSalary)}과 견주면 ${won(F.cafeLaborGap)} 차이로, 4대보험·퇴직급여를 빠뜨린 손익분기점은 그만큼 낮게 나옵니다. ` +
        `직원 ${I.headcount}명이면 월 ${won(F.laborMonthly)}, 연 ${won(F.laborAnnual)}이고, 두 계산기를 이어 쓰지 않으면 이 차이는 어디에도 표시되지 않습니다.`,
    },
    {
      h2: `배달 ${manwon(I.order, 1)} × 월 ${num(I.orders)}건의 수수료는 ${BEST} ${won(F.bestFee)}에서 ${WORST} ${won(F.worstFee)} — 카페 변동비율에 얹으면 손익분기점이 ${won(F.cafeDeliveryLift)} 오른다`,
      body:
        `배달앱 수수료 엔진에 주문 ${manwon(I.order, 1)}·월 ${num(I.orders)}건(매출 ${manwon(F.deliveryRevenue)})을 넣으면 월 총수수료는 가장 싼 ${BEST} ${won(F.bestFee)}(실질 ${pct(F.bestRate, 1)})에서 가장 비싼 ${WORST} ${won(F.worstFee)}(${pct(F.worstRate, 1)})까지입니다. ` +
        `이 실질 수수료율 ${pct(F.bestRate, 1)}를 손익분기점 계산기의 카페 변동비율 ${pct(I.cafeVar)}에 더해 ${pct(F.cafeDeliveryVar, 1)}로 두면, 고정비 ${manwon(I.cafeFixed)}의 월 손익분기 매출은 ${won(F.cafeBep)}에서 ${won(F.cafeDeliveryBep)}으로 ${won(F.cafeDeliveryLift)} 오릅니다. ` +
        `배달 주문이 매출 전부일 때의 값이므로 실제 상승폭은 배달 비중에 비례해 그 사이 어딘가입니다. ` +
        `배달앱 페이지의 실질 수수료율 열은 그 자체로 손익분기점 계산기의 입력이고, 두 계산기를 이어 읽으면 "배달을 켜면 손익분기점이 얼마나 오르나"가 한 숫자로 나옵니다.`,
    },
    {
      h2: `차량비 ${manwon(I.carCost)}·사용비율 ${pct(I.carUse)}·세율 ${pct(I.carRate)}의 절세 ${won(F.carSaving)}은 회의 8명·격주의 매입세액 ${won(F.meetingVat)}의 ${times(F.carSaving, F.meetingVat)}`,
      body:
        `차량 경비 엔진에 연 ${manwon(I.carCost)}·업무 사용 ${pct(I.carUse)}·지방소득세 포함 세율 ${pct(I.carRate)}를 가정해 넣으면 손금 ${won(F.carDeductible)}, 절세 ${won(F.carSaving)}, 사적 사용분 ${won(F.carNon)}입니다. 차량비 대비 절세는 ${pct(F.carSavingShare, 2)}입니다. ` +
        `회의 비용 엔진에 ${I.attendees}명·1인 ${won(I.perHead)}·월 ${I.meetings}회·${I.months}개월을 넣으면 연 예산 ${won(F.meetingAnnual)}, 매입세액 ${won(F.meetingVat)}, 1인당 연 ${won(F.meetingPerPerson)}입니다. ` +
        `차량 절세가 회의 매입세액의 ${times(F.carSaving, F.meetingVat)}이지만, 차량 절세는 세율에 비례하고 회의 매입세액은 세율과 무관하게 정액이라 세율이 낮은 사업자일수록 두 값이 가까워집니다. ` +
        `연 회의 예산 ${won(F.meetingAnnual)}은 앞 발견의 직원 한 명 월 인건비 ${won(F.laborTotal)}의 ${num(F.meetingVsLabor, 1)}배로, 세 계산기의 숫자를 한 줄에 놓으면 지출의 크기 순서가 보입니다.`,
    },
    {
      h2: `소매 매출 ${manwon(I.serRevenue)}·주요경비 ${pct(F.serMajorsShare, 1)}에서 기준경비율 ${won(F.serStd)} 대 단순경비율 ${won(F.serSimp)} — 부가세까지 합치면 격차가 ${won(F.serCombinedGap)}`,
      body:
        `기준경비율 계산기에 소매업·매출 ${manwon(I.serRevenue)}·매입 ${manwon(I.serPurchase)}·임차료 ${manwon(I.serRent)}·인건비 없이 넣으면 기준경비율 방식의 소득세는 ${won(F.serStd)}(과세소득 ${won(F.serStdTaxable)}), 단순경비율은 ${won(F.serSimp)}(과세소득 ${won(F.serSimpTaxable)})입니다. ` +
        `주요경비가 매출의 ${pct(F.serMajorsShare, 1)}인데 문턱(단순경비율 − 기준경비율)은 ${pct(F.serThreshold, 1)}라 단순경비율이 ${won(-F.serDiff)} 유리합니다. ` +
        `같은 사업자의 부가세를 부가세 비교 엔진(소매·매입 비율 ${pct(F.serPurchaseShare, 1)})으로 보면 일반과세 ${won(F.serVatGeneral)}, 간이과세 ${won(F.serVatSimple)}입니다. 소득세와 부가세를 합치면 기준경비율+일반과세 ${won(F.serTaxPlusVat)} 대 단순경비율+간이과세 ${won(F.serSimpPlusVat)}으로 격차가 ${won(F.serCombinedGap)}까지 벌어집니다. ` +
        `소득세 계산기와 부가세 계산기는 서로 다른 세목을 다루지만 작은 사업자에게는 둘이 같은 방향으로 움직이며, 매출 성장은 두 문턱을 함께 넘는 일입니다.`,
    },
    {
      h2: `아홉 계산기 가운데 결과가 입력에 비례하는 것은 넷, 경계를 가진 것은 다섯 — 경계가 있는 쪽에서만 "얼마부터"라는 질문이 성립한다`,
      body:
        `회의 비용·차량 경비·배달앱 수수료·손익분기점은 입력을 두 배로 하면 결과도 두 배가 되는 곱셈 계산기라 어느 값에서도 결론이 뒤집히지 않습니다(배달앱은 정액 배달대행료 때문에 요율만 완만히 내려갑니다). ` +
        `반면 개인 vs 법인(영업이익 경계), 법인세(과세표준 ${manwon(I.corpTaxable)}에서 실효 ${pct(F.ctEff, 2)}처럼 구간이 만드는 굴절), 부가세 비교(면제선 ${manwon(I.vatExempt)}과 적용 상한), 인건비(국민연금 상한), 기준경비율(주요경비 문턱 ${pct(F.serThreshold, 1)})은 어느 지점을 넘는 순간 답이 바뀝니다. ` +
        `앞의 넷은 "얼마나"를, 뒤의 다섯은 "얼마부터"를 묻는 도구이고, 각 도구 페이지의 다이제스트는 그 경계를 전 구간 스캔으로 찍어 둔 것입니다. ` +
        `이 홈의 일곱 발견은 서로 다른 계산기를 한 사업자의 숫자로 이어 본 것으로, 입력 가정은 각 문장에 적힌 값이며 도구 페이지의 기본값과는 다릅니다.`,
    },
  ],
};
