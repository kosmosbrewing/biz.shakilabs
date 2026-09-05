// /corp-tax 파생 다이제스트 — 계산기는 과세표준 하나의 세액·실효세율만 보여준다. 여기는
// calculateCorpTax를 100만원~1조원 전 구간 돌려서만 보이는 것을 적는다: 실효세율이 한계세율에
// 붙는 속도, 2억 경계 앞뒤의 1원, 세후 목표액을 만드는 세전액, 같은 앱의 다른 엔진과의 일치.
// 세율표 한 줄을 옮겨 적는 문장은 발견이 아니다. 산문의 숫자는 F(엔진 실행값)·I(입력값)에서만 온다.

import { CORP_TAX_BRACKETS } from "../bizExpansionData";
import { DIVIDEND_LOCAL_TAX_RATE, DIVIDEND_TAX_RATE } from "../bizConstants";
import { calculateCorpTax } from "@/utils/bizExpansionCalc";
import { calcCorpAfterTax } from "@/utils/bizCalc";
import { calculateStandardExpenseRate } from "@/utils/standardExpenseRateCalc";
import { type Digest, manwon, num, pct, pp, won } from "./format";

export const CORP_TAX_INPUTS = {
  defaultTaxable: 500_000_000,
  presetA: 100_000_000,
  presetB: 200_000_000,
  presetC: 1_000_000_000,
  minTaxable: 1_000_000,
  bracket1: CORP_TAX_BRACKETS[0].limit,
  bracket2: CORP_TAX_BRACKETS[1].limit,
  bracket3: CORP_TAX_BRACKETS[2].limit,
  maxTaxable: 1_000_000_000_000,
  rate1: CORP_TAX_BRACKETS[0].rate,
  rate2: CORP_TAX_BRACKETS[1].rate,
  rate3: CORP_TAX_BRACKETS[2].rate,
  rate4: CORP_TAX_BRACKETS[3].rate,
  netTarget: 500_000_000,
  effTarget: 0.2,
  gapTarget: 0.01,
  scanStep: 10_000_000,
  fineStep: 10_000,
  dividendRate: DIVIDEND_TAX_RATE + DIVIDEND_LOCAL_TAX_RATE,
};
const I = CORP_TAX_INPUTS;

const run = (taxableIncome: number) => {
  const r = calculateCorpTax({ taxableIncome });
  if (!r.success) throw new Error(`corp tax failed at ${taxableIncome}`);
  return r.data;
};

/** 실효세율이 목표에 처음 닿는 과세표준 (1천만원 단위) */
export function taxableForEffective(target: number): number {
  for (let t = I.bracket1; t <= I.bracket2; t += I.scanStep) if (run(t).effectiveRate >= target) return t;
  return Number.NaN;
}

/** 세후 이익이 목표에 처음 닿는 과세표준 (1만원 단위) */
export function taxableForNet(target: number): number {
  for (let t = target; t <= target * 2; t += I.fineStep) if (run(t).afterTaxIncome >= target) return t;
  return Number.NaN;
}

function facts() {
  const d = run(I.defaultTaxable);
  const justOver = run(I.bracket1 + 1);
  const atB = run(I.bracket1);
  const eff20 = taxableForEffective(I.effTarget);
  const midRate = (I.rate1 + I.rate2) / 2;
  const midTaxable = taxableForEffective(midRate);
  const gap1 = taxableForEffective(I.rate2 - I.gapTarget);
  const netGross = taxableForNet(I.netTarget);
  const b2 = run(I.bracket2);
  const b3 = run(I.bracket3);
  const top = run(I.maxTaxable);
  // 같은 앱의 다른 엔진(bizCalc: 세율×과세표준−누진공제)으로 같은 과세표준을 계산 — 두 산식이 일치해야 한다
  const other = calcCorpAfterTax(I.defaultTaxable, 0, 0);
  // 같은 금액을 종합소득으로 신고했을 때 (경비 0·주요경비 0 → 과세표준 = 매출)
  const ind = calculateStandardExpenseRate({ revenue: I.defaultTaxable, standardRate: 0, simpleRate: 0, purchaseCost: 0, rentCost: 0, laborCost: 0 });
  if (!ind.success) throw new Error("income tax failed");
  const dividendTax = d.afterTaxIncome * I.dividendRate;
  return {
    tax: d.tax, eff: d.effectiveRate, after: d.afterTaxIncome, midRate, midTaxable,
    grossPerNet: 1 / (1 - I.rate2), netLift: I.netTarget - d.afterTaxIncome,
    firstStep: I.rate2 - I.rate1,
    effCA: run(I.presetC).effectiveRate - run(I.presetA).effectiveRate, effRoom: I.rate2 - run(I.presetC).effectiveRate,
    effDB: d.effectiveRate - run(I.presetB).effectiveRate, effCD: run(I.presetC).effectiveRate - d.effectiveRate,
    firstSlice: atB.tax, secondSlice: d.tax - atB.tax, secondBase: I.defaultTaxable - I.bracket1,
    sliceRatio: (d.tax - atB.tax) / atB.tax, baseRatio: (I.defaultTaxable - I.bracket1) / I.bracket1,
    justOverTax: justOver.tax, justOverEff: justOver.effectiveRate, justOverMarginal: justOver.marginalRate,
    eff20, eff20Tax: run(eff20).tax, gap1, gap1Eff: run(gap1).effectiveRate,
    effA: run(I.presetA).effectiveRate, effB: run(I.presetB).effectiveRate, effC: run(I.presetC).effectiveRate,
    taxA: run(I.presetA).tax, taxC: run(I.presetC).tax, minTax: run(I.minTaxable).tax,
    netGross, netGrossTax: run(netGross).tax, netGrossAfter: run(netGross).afterTaxIncome, grossLift: netGross - I.defaultTaxable,
    b2Tax: b2.tax, b2Eff: b2.effectiveRate, b3Tax: b3.tax, b3Eff: b3.effectiveRate, topEff: top.effectiveRate, topTax: top.tax,
    rate3Step: I.rate3 - I.rate2, rate4Step: I.rate4 - I.rate3,
    step3Ratio: (I.rate2 - I.rate1) / (I.rate3 - I.rate2), step4Ratio: (I.rate2 - I.rate1) / (I.rate4 - I.rate3),
    otherCorpTax: other.corpTax, otherLocal: other.corpLocalTax, otherTotal: other.corpTax + other.corpLocalTax,
    indTax: ind.data.standard.totalTax, indEff: ind.data.standard.effectiveRate, indGap: ind.data.standard.totalTax - d.tax,
    dividendTax, withDividend: d.tax + dividendTax, withDividendEff: (d.tax + dividendTax) / I.defaultTaxable,
    stillLess: ind.data.standard.totalTax - d.tax - dividendTax,
    perEokLow: run(I.presetA).tax,
    perEokHigh: run(I.bracket1 + I.presetA).tax - run(I.bracket1).tax,
  };
}
const F = facts();

export const CORP_TAX_DIGEST: Digest = {
  facts: F,
  inputs: I,
  findings: [
    {
      h2: `과세표준 ${manwon(I.bracket1)}에 1원을 더하면 한계세율은 ${pct(F.justOverMarginal)}로 뛰지만 실효세율은 ${pct(F.justOverEff, 1)} 그대로다`,
      body:
        `이 계산기는 과세표준을 구간별로 잘라 세율을 곱하므로, ${manwon(I.bracket1)}을 1원 넘긴 순간 마지막 1원에만 ${pct(F.justOverMarginal)}가 붙고 세액은 ${won(F.justOverTax)}으로 ${manwon(I.bracket1)}일 때와 같습니다. ` +
        `실효세율이 두 세율의 중간인 ${pct(F.midRate, 1)}에 이르는 과세표준은 ${manwon(F.midTaxable)}, ${pct(I.effTarget)}에 처음 닿는 과세표준은 ${manwon(F.eff20)}(세액 ${manwon(F.eff20Tax)})입니다. ` +
        `한계세율 ${pct(I.rate2)}와의 격차가 ${pp(I.gapTarget)} 안으로 좁혀지려면 과세표준이 ${manwon(F.gap1)}은 되어야 하고(실효 ${pct(F.gap1Eff, 1)}), 상한 ${manwon(I.bracket2)}에서도 ${pct(F.b2Eff, 2)}에 그칩니다. ` +
        `"우리 회사는 ${pct(I.rate2)} 구간"이라는 말과 실제 부담률 사이에는 과세표준이 커질수록 천천히 닫히는 간격이 있습니다.`,
    },
    {
      h2: `기본값 ${manwon(I.defaultTaxable)}의 세액 ${manwon(F.tax)} 가운데 앞 ${manwon(I.bracket1)}이 ${manwon(F.firstSlice)}, 뒤 ${manwon(F.secondBase)}이 ${manwon(F.secondSlice)}`,
      body:
        `과세표준 ${manwon(I.defaultTaxable)}을 넣으면 법인세와 지방소득세 합계 ${won(F.tax)}, 실효세율 ${pct(F.eff, 1)}, 세후 이익 ${won(F.after)}이 나옵니다. ` +
        `이 세액을 구간으로 나누면 ${manwon(I.bracket1)}까지가 ${manwon(F.firstSlice)}, 초과분 ${manwon(F.secondBase)}이 ${manwon(F.secondSlice)}으로, 뒤쪽 금액이 앞쪽의 ${num(F.baseRatio, 1)}배인데 세액은 ${num(F.sliceRatio, 1)}배입니다. ` +
        `프리셋으로 보면 ${manwon(I.presetA)}은 ${manwon(F.taxA)}(실효 ${pct(F.effA)}), ${manwon(I.presetB)}은 ${manwon(F.firstSlice)}(${pct(F.effB)}), ${manwon(I.presetC)}은 ${manwon(F.taxC)}(${pct(F.effC, 1)})입니다. ` +
        `${manwon(I.bracket1)} 이하에서는 입력을 아무리 바꿔도 실효세율이 ${pct(F.effA)}로 고정되므로, 이 계산기가 실제로 정보를 주는 구간은 ${manwon(I.bracket1)}을 넘긴 뒤부터입니다.`,
    },
    {
      h2: `세후 ${manwon(I.netTarget)}을 남기려면 과세표준 ${manwon(F.netGross)}이 필요하다 — 세액 ${manwon(F.netGrossTax)}`,
      body:
        `계산기를 거꾸로 돌려 세후 이익 ${manwon(I.netTarget)}에 처음 닿는 과세표준을 ${manwon(I.fineStep)} 단위로 찾으면 ${won(F.netGross)}입니다. 이때 세액은 ${won(F.netGrossTax)}, 세후는 ${won(F.netGrossAfter)}입니다. ` +
        `과세표준 ${manwon(I.defaultTaxable)}을 그대로 넣었을 때의 세후 ${manwon(F.after)}과 견주면, 목표 세후를 ${manwon(F.netLift)} 올리는 데 과세표준은 ${manwon(F.grossLift)}이 더 필요합니다. ` +
        `추가분이 전부 ${pct(I.rate2)} 구간에 놓이기 때문에 세후 1원을 더 남기려면 세전 ${num(F.grossPerNet, 2)}원이 있어야 하고, 이 배율은 과세표준이 ${manwon(I.bracket2)}에 이를 때까지 변하지 않습니다. ` +
        `배당·상여 계획을 세후 금액에서 출발해 세우는 회사라면 이 역산이 세전 목표를 정하는 출발점입니다.`,
    },
    {
      h2: `같은 앱의 두 엔진이 ${manwon(I.defaultTaxable)}에서 같은 답을 낸다 — 구간 절단 ${manwon(F.tax)} = 누진공제 ${manwon(F.otherTotal)}`,
      body:
        `이 페이지의 엔진은 과세표준을 ${manwon(I.bracket1)} 이하와 초과로 잘라 지방소득세를 포함한 ${pct(I.rate1)}·${pct(I.rate2)}를 각각 곱합니다. ` +
        `개인 vs 법인 비교 페이지의 엔진은 다른 산식(과세표준 × 세율 − 누진공제)을 쓰는데, 과세표준 ${manwon(I.defaultTaxable)}을 넣으면 법인세 ${won(F.otherCorpTax)}에 지방소득세 ${won(F.otherLocal)}을 더해 ${won(F.otherTotal)}으로 이 계산기의 ${won(F.tax)}과 1원까지 같습니다. ` +
        `두 산식이 같은 답을 내는 것은 누진공제액이 정확히 "앞 구간에서 낮은 세율로 덜 낸 몫"이기 때문이며, 그 몫은 ${manwon(I.bracket1)} × (${pct(I.rate2)} − ${pct(I.rate1)})입니다. ` +
        `두 페이지의 법인세가 서로 다르게 나온다면 입력이 다른 것이지 산식이 다른 것이 아닙니다.`,
    },
    {
      h2: `${manwon(I.bracket2)} 위의 두 구간은 세율을 ${pp(F.rate3Step, 1)}·${pp(F.rate4Step, 1)}씩만 올린다 — 상한 ${manwon(I.bracket3)}에서도 실효 ${pct(F.b3Eff, 2)}`,
      body:
        `과세표준 ${manwon(I.bracket2)}에서 세액은 ${manwon(F.b2Tax)}, 실효세율 ${pct(F.b2Eff, 2)}입니다. 다음 구간 세율은 지방소득세 포함 ${pct(I.rate3, 1)}로 직전보다 ${pp(F.rate3Step, 1)} 높을 뿐이고, ` +
        `그 구간의 상한 ${manwon(I.bracket3)}에서 세액은 ${manwon(F.b3Tax)}, 실효세율은 ${pct(F.b3Eff, 2)}입니다. 마지막 구간 ${pct(I.rate4, 1)}까지 올라가는 입력 상한 ${manwon(I.maxTaxable)}에서도 실효세율은 ${pct(F.topEff, 2)}에 머뭅니다. ` +
        `즉 이 계산기가 다루는 네 구간 가운데 세 부담의 모양을 실제로 바꾸는 것은 ${manwon(I.bracket1)} 경계 하나뿐이고, 나머지 두 경계는 ${pp(F.rate3Step, 1)}·${pp(F.rate4Step, 1)}의 미세 조정입니다. ` +
        `${manwon(I.bracket1)} 아래에서 ${pct(I.rate1)}가 ${pct(I.rate2)}로 두 배가 되는 첫 경계와 비교하면 위쪽 경계들의 무게는 ${num(F.step3Ratio, 1)}분의 1·${num(F.step4Ratio, 1)}분의 1입니다.`,
    },
    {
      h2: `${manwon(I.defaultTaxable)}을 종합소득으로 신고하면 ${manwon(F.indTax)} — 법인세보다 ${manwon(F.indGap)} 많고, 전액 배당해도 ${manwon(F.stillLess)} 차이`,
      body:
        `같은 ${manwon(I.defaultTaxable)}을 개인사업자 과세표준으로 넣어 이 앱의 소득세 엔진을 돌리면 소득세와 지방소득세 합계 ${won(F.indTax)}, 실효세율 ${pct(F.indEff, 1)}가 나옵니다. 법인세 ${manwon(F.tax)}(${pct(F.eff, 1)})보다 ${manwon(F.indGap)} 많습니다. ` +
        `법인이 세후 ${manwon(F.after)}을 전부 배당하면 배당소득세 ${pct(I.dividendRate)}로 ${manwon(F.dividendTax)}이 추가되어 합계 ${manwon(F.withDividend)}, 실효 ${pct(F.withDividendEff, 1)}가 되지만, 그래도 종합소득세보다 ${manwon(F.stillLess)} 적습니다. ` +
        `이 격차는 과세표준 ${manwon(I.defaultTaxable)}이 개인 누진세율의 높은 구간에 걸리는 반면 법인은 ${manwon(I.bracket1)} 초과분에도 ${pct(I.rate2)}만 붙기 때문입니다. ` +
        `다만 이 비교는 4대보험과 대표 급여를 뺀 세금만의 비교이므로, 보험료까지 넣은 답은 개인 vs 법인 비교 페이지가 따로 냅니다.`,
    },
    {
      h2: `${manwon(I.bracket1)}까지는 1억원당 ${manwon(F.perEokLow)}, 그 위는 1억원당 ${manwon(F.perEokHigh)} — 같은 1억원의 값이 두 배가 된다`,
      body:
        `과세표준을 1억원씩 늘려 가며 세액 증가분을 재면 ${manwon(I.bracket1)}까지는 1억원마다 ${manwon(F.perEokLow)}이 늘고, ${manwon(I.bracket1)}을 넘긴 뒤에는 1억원마다 ${manwon(F.perEokHigh)}이 늘어납니다. ` +
        `입력 하한 ${manwon(I.minTaxable)}에서 세액은 ${won(F.minTax)}으로 역시 ${pct(I.rate1)}이고, 이 비율은 ${manwon(I.bracket1)}까지 한 번도 변하지 않습니다. ` +
        `그래서 결산 시점에 과세표준이 ${manwon(I.bracket1)} 근처라면 비용 인식 시기를 한 해 옮기는 것만으로 그 금액에 붙는 세율이 ${pct(I.rate1)}와 ${pct(I.rate2)} 사이를 오갑니다. ` +
        `이 계산기의 실효세율은 그 판단의 결과를 보여줄 뿐이며, 어느 해에 비용을 넣을지는 회계 기준과 세무 조정의 문제입니다.`,
    },
    {
      h2: `프리셋 ${manwon(I.presetC)}의 실효세율 ${pct(F.effC, 1)}는 ${manwon(I.presetA)}의 ${pct(F.effA)}보다 ${pp(F.effCA, 1)} 높고, ${pct(I.rate2)}까지는 ${pp(F.effRoom, 1)} 남는다`,
      body:
        `네 프리셋의 실효세율을 나란히 놓으면 ${manwon(I.presetA)} ${pct(F.effA)}, ${manwon(I.presetB)} ${pct(F.effB)}, ${manwon(I.defaultTaxable)} ${pct(F.eff, 1)}, ${manwon(I.presetC)} ${pct(F.effC, 1)}입니다. ` +
        `앞 두 프리셋은 실효세율이 같고, 셋째에서 ${pp(F.effDB, 1)}, 넷째에서 다시 ${pp(F.effCD, 1)} 오릅니다. 과세표준은 두 배·다섯 배·열 배로 커지는데 실효세율의 증가폭은 갈수록 줄어듭니다. ` +
        `${manwon(I.presetC)}에서도 한계세율 ${pct(I.rate2)}까지는 ${pp(F.effRoom, 1)}가 남아 있고, 이 남은 폭은 ${manwon(I.bracket1)}에서 낮은 세율로 낸 몫 ${manwon(F.firstSlice)}을 과세표준으로 나눈 값과 정확히 같습니다. ` +
        `실효세율을 ${pct(I.rate2)}에 붙일 만큼 이익을 키우는 것보다, ${manwon(I.bracket1)}까지의 낮은 세율 몫을 매년 빠짐없이 쓰는 쪽이 이 표에서는 더 큰 변수입니다.`,
    },
  ],
};
