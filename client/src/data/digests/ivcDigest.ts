// /individual-vs-corp 파생 다이제스트 — 계산기는 매출 하나를 넣은 결과만 보여준다. 여기는
// calcIndividualAfterTax·calcCorpAfterTax를 매출 1천만~30억(100만원 단위), 경비율 10~80%,
// 대표 급여 0~6천만 전 구간 돌려서만 보이는 것을 적는다: 승자가 뒤집히는 매출·경비율,
// 급여를 올릴수록 세후가 줄어드는 방향, 매출과 무관하게 고정되는 법인 경로의 비용.
// 세율 한 줄을 인용하는 문장은 발견이 아니다. 산문의 숫자는 F(엔진 실행값)·I(입력값)에서만 온다.

import { INDIVIDUAL_VS_CORP_PRESETS } from "../individualVsCorpContent";
import {
  CORP_TAX_BRACKETS,
  DIVIDEND_LOCAL_TAX_RATE,
  DIVIDEND_TAX_RATE,
  INCOME_TAX_BRACKETS,
  LOCAL_INCOME_TAX_RATE,
  SOCIAL_INSURANCE,
} from "../bizConstants";
import { calcCorpAfterTax, calcIndividualAfterTax } from "@/utils/bizCalc";
import { type Digest, manwon, pct, pp, times, won } from "./format";

// 계산기 기본값(useIndividualVsCorp)·프리셋·스캔 해상도·법령 상수. 산문의 숫자는 facts 아니면 여기서만 온다.
export const IVC_INPUTS = {
  expenseRate: 0.4,
  salary: 36_000_000,
  preset1: INDIVIDUAL_VS_CORP_PRESETS[0].value,
  preset2: INDIVIDUAL_VS_CORP_PRESETS[1].value,
  preset3: INDIVIDUAL_VS_CORP_PRESETS[2].value,
  preset4: INDIVIDUAL_VS_CORP_PRESETS[3].value,
  scanStep: 1_000_000,
  scanMax: 3_000_000_000,
  salaryMax: 60_000_000,
  expenseMin: 0.1,
  expenseMax: 0.8,
  expenseStep: 0.01,
  pensionCapMonthly: SOCIAL_INSURANCE.nationalPension.upperLimit,
  corpLowMax: CORP_TAX_BRACKETS[0].max,
  indMidMin: INCOME_TAX_BRACKETS[2].min,
  indMidMax: INCOME_TAX_BRACKETS[2].max,
  indUpperMin: INCOME_TAX_BRACKETS[4].min,
  indUpperMax: INCOME_TAX_BRACKETS[4].max,
};
const I = IVC_INPUTS;

const diffAt = (revenue: number, expense = I.expenseRate, salary = I.salary) =>
  calcCorpAfterTax(revenue, expense, salary).afterTaxIncome - calcIndividualAfterTax(revenue, expense).afterTaxIncome;

/** 법인 세후가 개인 세후를 처음 앞서는 매출 (100만원 단위) */
export function crossoverRevenue(): number {
  for (let r = I.scanStep; r <= I.scanMax; r += I.scanStep) if (diffAt(r) > 0) return r;
  return Number.NaN;
}

/** 매출 1억에서 개인이 앞서기 시작하는 최소 경비율(1%p 단위) */
export function expenseFlip(): number {
  const steps = Math.round((I.expenseMax - I.expenseMin) / I.expenseStep);
  for (let k = 0; k <= steps; k += 1) {
    const e = Number((I.expenseMin + k * I.expenseStep).toFixed(2));
    if (diffAt(I.preset2, e) < 0) return e;
  }
  return Number.NaN;
}

/** 주어진 매출에서 법인 세후를 최대로 만드는 대표 급여(100만원 단위) */
export function bestSalary(revenue: number): { salary: number; afterTax: number } {
  let best = { salary: 0, afterTax: -Infinity };
  for (let s = 0; s <= I.salaryMax; s += I.scanStep) {
    const afterTax = calcCorpAfterTax(revenue, I.expenseRate, s).afterTaxIncome;
    if (afterTax > best.afterTax) best = { salary: s, afterTax };
  }
  return best;
}

function facts() {
  const cross = crossoverRevenue();
  const presets = [I.preset1, I.preset2, I.preset3, I.preset4];
  const ind = presets.map((r) => calcIndividualAfterTax(r, I.expenseRate));
  const corp = presets.map((r) => calcCorpAfterTax(r, I.expenseRate, I.salary));
  const best = bestSalary(I.preset2);
  const eFlip = expenseFlip();
  const corpLow = CORP_TAX_BRACKETS[0].rate * (1 + LOCAL_INCOME_TAX_RATE);
  const corpHigh = CORP_TAX_BRACKETS[1].rate * (1 + LOCAL_INCOME_TAX_RATE);
  const divRate = DIVIDEND_TAX_RATE + DIVIDEND_LOCAL_TAX_RATE;
  const routeLow = corpLow + (1 - corpLow) * divRate;
  const routeHigh = corpHigh + (1 - corpHigh) * divRate;
  const indMid = INCOME_TAX_BRACKETS[2].rate * (1 + LOCAL_INCOME_TAX_RATE);
  const indUpper = INCOME_TAX_BRACKETS[4].rate * (1 + LOCAL_INCOME_TAX_RATE);
  const capTaxable = I.pensionCapMonthly * 12;
  const atCap = calcIndividualAfterTax(capTaxable / (1 - I.expenseRate), I.expenseRate);
  const atDouble = calcIndividualAfterTax((capTaxable * 2) / (1 - I.expenseRate), I.expenseRate);
  const salaryTax = corp[1].salaryIncomeTax + corp[1].salaryLocalTax;
  const indIns2 = ind[1].nationalPension + ind[1].healthInsurance + ind[1].longTermCare;
  const fixedCorpCost = corp[0].socialInsurance + corp[0].salaryIncomeTax + corp[0].salaryLocalTax;
  return {
    cross, crossProfit: cross * (1 - I.expenseRate),
    lead1: -diffAt(I.preset1), lead2: -diffAt(I.preset2), lead3: diffAt(I.preset3), lead4: diffAt(I.preset4),
    bestSalary: best.salary, bestAfter: best.afterTax,
    zeroAfter: calcCorpAfterTax(I.preset2, I.expenseRate, 0).afterTaxIncome,
    defaultAfter: corp[1].afterTaxIncome,
    maxAfter: calcCorpAfterTax(I.preset2, I.expenseRate, I.salaryMax).afterTaxIncome,
    social2: corp[1].socialInsurance, socialShare: corp[1].socialInsurance / I.salary, salaryTax2: salaryTax,
    socialVsTax: corp[1].socialInsurance / salaryTax,
    indPension2: ind[1].nationalPension, indHealth2: ind[1].healthInsurance + ind[1].longTermCare,
    indIns2, insGap2: corp[1].socialInsurance - indIns2,
    corpLow, corpHigh, divRate, routeLow, routeHigh, indMid, indUpper,
    midGap: indMid - routeLow, upperGap: indUpper - routeHigh,
    capTaxable, capTaxableDouble: capTaxable * 2,
    capPension: atCap.nationalPension, doublePension: atDouble.nationalPension,
    capHealth: atCap.healthInsurance, doubleHealth: atDouble.healthInsurance,
    eFlip, eFlipPrev: eFlip - I.expenseStep, expenseMargin: I.expenseRate - eFlip + I.expenseStep,
    profitBefore: calcCorpAfterTax(I.preset2, eFlip - I.expenseStep, I.salary).operatingProfit,
    profitAtFlip: calcCorpAfterTax(I.preset2, eFlip, I.salary).operatingProfit,
    corpTax1: corp[0].corpTax, profit1: corp[0].operatingProfit, profit4: corp[3].operatingProfit,
    fixedCorpCost, fixedShare1: fixedCorpCost / corp[0].operatingProfit, fixedShare4: fixedCorpCost / corp[3].operatingProfit,
    indBurden1: ind[0].totalTax / ind[0].taxableIncome, corpBurden1: corp[0].totalTax / corp[0].operatingProfit,
    indBurden4: ind[3].totalTax / ind[3].taxableIncome, corpBurden4: corp[3].totalTax / corp[3].operatingProfit,
    indTax4: ind[3].totalTax, corpTotal4: corp[3].totalTax, totalGap4: ind[3].totalTax - corp[3].totalTax,
    div4: corp[3].dividendAmount, divTax4: corp[3].dividendTax, corpTaxAll4: corp[3].corpTax + corp[3].corpLocalTax,
  };
}

const F = facts();

export const IVC_DIGEST: Digest = {
  facts: F,
  inputs: I,
  findings: [
    {
      h2: `법인이 앞서기 시작하는 매출은 ${manwon(F.cross)} — 그 전까지는 매출을 올려도 개인이 이긴다`,
      body:
        `경비율 ${pct(I.expenseRate)}·대표 급여 ${manwon(I.salary)}을 고정하고 매출을 ${manwon(I.scanStep)} 단위로 ${manwon(I.scanMax)}까지 올리며 두 세후소득을 비교하면, ` +
        `법인 세후가 개인 세후를 처음 넘어서는 매출은 ${manwon(F.cross)}이고 그 뒤로는 다시 뒤집히지 않습니다. ` +
        `프리셋 네 개로 읽으면 ${manwon(I.preset1)}에서 개인이 ${manwon(F.lead1)} 앞서고, ${manwon(I.preset2)}에서도 개인이 ${manwon(F.lead2)} 앞서다가, ` +
        `${manwon(I.preset3)}에서는 법인이 ${manwon(F.lead3)}, ${manwon(I.preset4)}에서는 ${manwon(F.lead4)} 앞섭니다. ` +
        `매출 ${manwon(I.preset2)}과 ${manwon(I.preset3)} 사이에 경계가 있고, 그 경계에서 멀어질수록 격차가 한쪽으로만 벌어지는 구조입니다.`,
    },
    {
      h2: `매출 ${manwon(I.preset2)}에서 대표 급여를 올릴수록 법인 세후가 줄어든다 — 최적은 ${manwon(F.bestSalary)}`,
      body:
        `이 계산기의 법인 모델은 영업이익에서 급여를 빼고 법인세를 낸 뒤 남는 돈을 전부 배당합니다. 매출 ${manwon(I.preset2)}·경비율 ${pct(I.expenseRate)}에서 급여를 0원부터 ${manwon(I.salaryMax)}까지 ${manwon(I.scanStep)} 단위로 훑으면 ` +
        `법인 세후는 급여 ${manwon(F.bestSalary)}에서 ${manwon(F.bestAfter, 1)}으로 가장 크고, 급여 0원이면 ${manwon(F.zeroAfter, 1)}, 기본값 ${manwon(I.salary)}이면 ${manwon(F.defaultAfter, 1)}, ${manwon(I.salaryMax)}이면 ${manwon(F.maxAfter, 1)}입니다. ` +
        `급여가 늘수록 세후가 줄어드는 이유는 급여에 붙는 4대보험(사업주·근로자 합산)과 근로소득세의 합이 배당 경로의 세율보다 무겁기 때문입니다. ` +
        `"급여를 많이 가져가면 법인세가 줄어 유리하다"는 통념은 이 모델 안에서는 성립하지 않으며, 실제로는 근로소득세액공제와 건강보험 지역가입 여부까지 따져야 방향이 정해집니다.`,
    },
    {
      h2: `급여 ${manwon(I.salary)}에 붙는 4대보험 ${manwon(F.social2, 1)}은 그 급여의 소득세의 ${times(F.social2, F.salaryTax2)}`,
      body:
        `법인 경로에서 대표 급여 ${manwon(I.salary)}에 붙는 4대보험은 사업주분과 근로자분을 합쳐 연 ${won(F.social2)}, 급여의 ${pct(F.socialShare, 1)}입니다. ` +
        `같은 급여의 근로소득세와 지방소득세는 합쳐 ${won(F.salaryTax2)}에 그쳐, 보험료가 세금의 ${times(F.social2, F.salaryTax2)}입니다. ` +
        `개인사업자 쪽은 매출 ${manwon(I.preset2)}에서 국민연금 ${won(F.indPension2)}과 건강보험·장기요양 ${won(F.indHealth2)}으로 합쳐 ${manwon(F.indIns2, 1)}이라, ` +
        `법인 대표가 지역가입자였던 개인사업자보다 보험료를 ${manwon(F.insGap2, 1)} 더 냅니다. 법인 전환의 첫 비용은 법인세가 아니라 보험료입니다.`,
    },
    {
      h2: `배당까지 합친 법인 경로의 세율은 ${pct(F.routeLow)}와 ${pct(F.routeHigh)} — 개인 누진세율 어느 구간과 마주치는지가 승부`,
      body:
        `법인에 남긴 이익 1원은 법인세와 지방소득세 ${pct(F.corpLow)}를 낸 뒤 나머지에 배당소득세 ${pct(F.divRate)}가 붙습니다. 합치면 과세표준 ${manwon(I.corpLowMax)} 이하 구간에서 ${pct(F.routeLow)}, 초과 구간에서 ${pct(F.routeHigh)}입니다. ` +
        `개인사업자는 지방소득세를 얹은 한계세율이 과세표준 ${manwon(I.indMidMin)}~${manwon(I.indMidMax)} 구간에서 ${pct(F.indMid)}, ${manwon(I.indUpperMin)}~${manwon(I.indUpperMax)} 구간에서 ${pct(F.indUpper)}입니다. ` +
        `즉 개인 과세표준이 ${manwon(I.indMidMin)}을 넘어 ${pct(F.indMid)} 구간에 들어서면 배당 경로 ${pct(F.routeLow)}보다 ${pp(F.midGap)} 비싸지고, ${pct(F.indUpper)} 구간에서는 격차가 ${pp(F.upperGap)}까지 벌어집니다. ` +
        `첫 발견의 경계 매출 ${manwon(F.cross)}은 개인 과세표준이 이 세율 역전 지점을 지나면서 4대보험 고정비를 상쇄하는 자리입니다.`,
    },
    {
      h2: `과세소득 ${manwon(F.capTaxable)}부터 개인 국민연금은 ${won(F.capPension)}에 멈춘다 — 그 위에서 자라는 것은 건강보험뿐`,
      body:
        `개인사업자 국민연금은 월 기준소득 ${manwon(I.pensionCapMonthly)}이 상한이라, 연 과세소득이 ${manwon(F.capTaxable)}에 닿으면 보험료가 ${won(F.capPension)}에서 더 늘지 않습니다. ` +
        `과세소득을 두 배인 ${manwon(F.capTaxableDouble)}으로 올려도 국민연금은 그대로 ${won(F.doublePension)}인데, 건강보험은 ${won(F.capHealth)}에서 ${won(F.doubleHealth)}으로 정확히 두 배가 됩니다. ` +
        `그래서 소득이 커질수록 개인의 보험료 부담은 국민연금이 아니라 건강보험이 끌고 가고, 법인 대표 급여도 같은 상한을 쓰므로 급여를 ${manwon(F.capTaxable)} 넘게 책정해도 국민연금은 더 늘지 않습니다. ` +
        `상한 아래에서는 소득 1원당 보험료가 일정하지만 상한을 넘는 순간 국민연금 몫이 0이 되므로, 이 계산기의 세후 곡선은 ${manwon(F.capTaxable)} 근처에서 기울기가 한 번 꺾입니다.`,
    },
    {
      h2: `매출 ${manwon(I.preset2)}의 승자는 경비율이 정한다 — ${pct(F.eFlipPrev)}까지 법인, ${pct(F.eFlip)}부터 개인`,
      body:
        `매출을 ${manwon(I.preset2)}에 고정하고 경비율 슬라이더를 ${pct(I.expenseMin)}부터 ${pct(I.expenseMax)}까지 ${pp(I.expenseStep)}씩 옮기면, 법인이 앞서는 것은 ${pct(F.eFlipPrev)}까지이고 ${pct(F.eFlip)}부터는 개인이 앞섭니다. ` +
        `경계의 영업이익은 ${manwon(F.profitAtFlip)}과 ${manwon(F.profitBefore)} 사이로, 첫 발견의 매출 경계 ${manwon(F.cross)}에 경비율 ${pct(I.expenseRate)}를 적용한 영업이익 ${manwon(F.crossProfit)}과 거의 같은 자리입니다. ` +
        `즉 승부를 가르는 것은 매출도 경비율도 아니고 둘이 만드는 영업이익 하나이며, 그 경계는 ${manwon(F.profitAtFlip)} 언저리에 있습니다. ` +
        `기본 경비율 ${pct(I.expenseRate)}로 본 결과가 개인 유리라도, 실제 경비율이 ${pp(F.expenseMargin)}만 낮으면 결론이 반대가 됩니다.`,
    },
    {
      h2: `매출 ${manwon(I.preset1)}에서 법인세는 ${won(F.corpTax1)}인데 법인 세후가 개인보다 ${manwon(F.lead1)} 적다`,
      body:
        `매출 ${manwon(I.preset1)}·경비율 ${pct(I.expenseRate)}의 영업이익 ${manwon(F.profit1)}은 대표 급여 ${manwon(I.salary)}보다 작아 법인 과세표준이 0이 되고 법인세도 ${won(F.corpTax1)}입니다. ` +
        `그런데도 법인 세후가 개인보다 ${manwon(F.lead1)} 적은 이유는 급여에 붙는 4대보험과 근로소득세 ${manwon(F.fixedCorpCost, 1)}이 매출과 무관하게 고정되기 때문입니다. ` +
        `이 고정비는 네 프리셋 어디서나 같은 금액이라, 영업이익 ${manwon(F.profit1)}에서는 이익의 ${pct(F.fixedShare1, 1)}를 차지하고 영업이익 ${manwon(F.profit4)}에서는 ${pct(F.fixedShare4, 1)}로 줄어듭니다. ` +
        `영업이익 대비 총부담률로 보면 ${manwon(I.preset1)}에서 개인 ${pct(F.indBurden1, 1)} 대 법인 ${pct(F.corpBurden1, 1)}, ${manwon(I.preset4)}에서 개인 ${pct(F.indBurden4, 1)} 대 법인 ${pct(F.corpBurden4, 1)}로 순서가 뒤집힙니다.`,
    },
    {
      h2: `매출 ${manwon(I.preset4)}에서 법인의 이점 ${manwon(F.lead4)} 뒤에는 배당소득세 ${manwon(F.divTax4)}이 있다`,
      body:
        `매출 ${manwon(I.preset4)}·경비율 ${pct(I.expenseRate)}에서 개인사업자의 세금과 보험료는 ${manwon(F.indTax4)}, 법인 경로의 합계는 ${manwon(F.corpTotal4)}으로 법인이 ${manwon(F.totalGap4)} 적습니다. ` +
        `법인 합계 안을 뜯어보면 배당 가능액 ${manwon(F.div4)}에 붙는 배당소득세가 ${manwon(F.divTax4)}으로, 법인세·지방소득세 ${manwon(F.corpTaxAll4)}보다 큽니다. ` +
        `이익을 법인에 유보하고 배당하지 않는다면 이 ${manwon(F.divTax4)}은 당장은 나가지 않지만, 그만큼은 대표의 손에도 들어오지 않습니다. ` +
        `이 계산기는 전액 배당을 전제하므로 여기 나오는 법인 세후는 "다 꺼냈을 때"의 하한이고, 유보 전략의 이점은 별도로 따져야 합니다.`,
    },
  ],
};
