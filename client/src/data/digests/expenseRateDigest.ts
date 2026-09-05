// /standard-expense-rate 파생 다이제스트 — 계산기는 업종·매출·주요경비 한 조합의 두 방식 세금만 보여준다.
// 여기는 calculateStandardExpenseRate를 10업종, 매출 3천만~2억(1만원 단위), 주요경비 변화로 돌려서만
// 보이는 것을 적는다: 기준경비율이 이기기 시작하는 주요경비 비율(= 두 경비율의 차), 주요경비를 고정했을 때
// 승자가 뒤집히는 매출, 10업종 전부에서 단순경비율이 이기는 기본값과 그 열의 적용 가능성.
// 산문의 숫자는 F·I에서만 온다.

import { INDUSTRY_EXPENSE_RATES } from "../standardExpenseRate";
import { calculateStandardExpenseRate } from "@/utils/standardExpenseRateCalc";
import { type Digest, eun, manwon, pct, pp, times, won } from "./format";

const ind = (key: string) => INDUSTRY_EXPENSE_RATES.find((i) => i.key === key)!;

export const EXPENSE_RATE_INPUTS = {
  revenue: 100_000_000,
  purchase: 10_000_000,
  rent: 12_000_000,
  labor: 15_000_000,
  majors: 37_000_000,
  presetA: 30_000_000,
  presetB: 50_000_000,
  presetD: 200_000_000,
  scanStep: 10_000,
  extraMajor: 10_000_000,
  itStandard: ind("it").standardRate / 100,
  itSimple: ind("it").simpleRate / 100,
  foodSimple: ind("food").simpleRate / 100,
  consultingSimple: ind("consulting").simpleRate / 100,
  thresholdDefault: ind("it").simpleThreshold * 10_000,
  thresholdLow: ind("design").simpleThreshold * 10_000,
  industries: INDUSTRY_EXPENSE_RATES.length,
  manwonUnit: 10_000,
};
const I = EXPENSE_RATE_INPUTS;
const run = (key: string, revenue = I.revenue, majors = { purchaseCost: I.purchase, rentCost: I.rent, laborCost: I.labor }) => {
  const i = ind(key);
  const r = calculateStandardExpenseRate({ revenue, standardRate: i.standardRate, simpleRate: i.simpleRate, ...majors });
  if (!r.success) throw new Error(`expense rate failed for ${key}`);
  return r.data;
};

/** 주요경비를 기본값에 고정했을 때 단순경비율이 처음 이기는 매출 (1만원 단위) */
export function revenueFlip(key: string): number {
  for (let r = I.presetA; r <= I.presetD; r += I.scanStep) if (run(key, r).recommendation === "simple") return r;
  return Number.NaN;
}

function facts() {
  const it = run("it");
  const all = INDUSTRY_EXPENSE_RATES.map((i) => ({ key: i.key, r: run(i.key), gap: (i.simpleRate - i.standardRate) / 100 }));
  const simpleWins = all.filter((x) => x.r.recommendation === "simple").length;
  const overThreshold = INDUSTRY_EXPENSE_RATES.filter((i) => I.revenue > i.simpleThreshold * I.manwonUnit).length;
  const byDiff = all.slice().sort((a, b) => a.r.taxDifference - b.r.taxDifference);
  const flip = revenueFlip("it");
  const justBefore = run("it", flip - I.scanStep);
  const a = run("it", I.presetA);
  const b = run("it", I.presetB);
  const d2 = run("it", I.presetD);
  const food = run("food");
  const consulting = run("consulting");
  const noMajors = run("it", I.revenue, { purchaseCost: 0, rentCost: 0, laborCost: 0 });
  const moreMajors = run("it", I.revenue, { purchaseCost: I.purchase + I.extraMajor, rentCost: I.rent, laborCost: I.labor });
  const d2More = run("it", I.presetD, { purchaseCost: I.purchase + I.extraMajor, rentCost: I.rent, laborCost: I.labor });
  return {
    foodGap: (ind("food").simpleRate - ind("food").standardRate) / 100, consultingGap: (ind("consulting").simpleRate - ind("consulting").standardRate) / 100,
    foodThresholdMajors: (ind("food").simpleRate - ind("food").standardRate) / 100 * I.revenue, simpleSpread: I.foodSimple - I.consultingSimple,
    aAdv: a.simple.totalTax - a.standard.totalTax, bAdv: b.simple.totalTax - b.standard.totalTax,
    itGap: I.itSimple - I.itStandard, itThresholdMajors: (I.itSimple - I.itStandard) * I.revenue, majorsShare: I.majors / I.revenue,
    stdTax: it.standard.totalTax, simpTax: it.simple.totalTax, diff: -it.taxDifference, stdTaxable: it.standard.taxableIncome, simpTaxable: it.simple.taxableIncome,
    stdExpenses: it.standard.expenses, simpExpenses: it.simple.expenses, ratePart: it.standard.expenses - I.majors,
    simpleWins, industries: I.industries, overThreshold,
    smallestGap: -byDiff[byDiff.length - 1].r.taxDifference, largestGap: -byDiff[0].r.taxDifference,
    flip, flipShare: I.majors / flip, beforeStd: justBefore.standard.totalTax, beforeSimp: justBefore.simple.totalTax,
    aStd: a.standard.totalTax, aSimp: a.simple.totalTax, bStd: b.standard.totalTax, bSimp: b.simple.totalTax, dStd: d2.standard.totalTax, dSimp: d2.simple.totalTax, dGap: d2.standard.totalTax - d2.simple.totalTax,
    aMajorsShare: I.majors / I.presetA, bMajorsShare: I.majors / I.presetB,
    foodSimpTax: food.simple.totalTax, foodSimpEff: food.simple.effectiveRate, consultingSimpTax: consulting.simple.totalTax, consultingSimpEff: consulting.simple.effectiveRate,
    effRatio: consulting.simple.effectiveRate / food.simple.effectiveRate, foodSimpTaxable: food.simple.taxableIncome, consultingSimpTaxable: consulting.simple.taxableIncome,
    foodStdTax: food.standard.totalTax, foodDiff: -food.taxDifference,
    noMajorsTax: noMajors.standard.totalTax, noMajorsTaxable: noMajors.standard.taxableIncome, noMajorsGap: noMajors.standard.totalTax - it.standard.totalTax,
    majorsVsRate: I.majors / (it.standard.expenses - I.majors),
    extraSaving1: it.standard.totalTax - moreMajors.standard.totalTax, extraSaving2: d2.standard.totalTax - d2More.standard.totalTax,
    extraRate1: (it.standard.totalTax - moreMajors.standard.totalTax) / I.extraMajor, extraRate2: (d2.standard.totalTax - d2More.standard.totalTax) / I.extraMajor,
    savingRatio: (d2.standard.totalTax - d2More.standard.totalTax) / (it.standard.totalTax - moreMajors.standard.totalTax),
  };
}
const F = facts();
const LABEL = (k: string) => ind(k).label;
const byDiffKeys = INDUSTRY_EXPENSE_RATES.map((i) => ({ key: i.key, diff: run(i.key).taxDifference })).sort((a, b) => a.diff - b.diff);

export const EXPENSE_RATE_DIGEST: Digest = {
  facts: F,
  inputs: I,
  findings: [
    {
      h2: `기준경비율이 이기는 조건은 주요경비가 매출의 ${pct(F.itGap, 1)}(${LABEL("it")}) 이상 — 두 경비율의 차이가 그 문턱이다`,
      body:
        `기준경비율 방식의 경비는 주요경비 + 매출 × 기준경비율, 단순경비율 방식은 매출 × 단순경비율이므로 두 방식은 주요경비가 매출 × (단순경비율 − 기준경비율)일 때 같아집니다. ` +
        `${eun(LABEL("it"))} ${pct(I.itSimple, 1)} − ${pct(I.itStandard, 1)} = ${pp(F.itGap, 1)}로, 매출 ${manwon(I.revenue)}에서 주요경비 ${manwon(F.itThresholdMajors)}이 문턱입니다. 기본값 주요경비 ${manwon(I.majors)}(매출의 ${pct(F.majorsShare)})은 그 아래라 단순경비율이 ${won(F.diff)} 유리합니다. ` +
        `같은 문턱을 업종별로 읽으면 ${LABEL("food")} ${pp(F.foodGap, 1)}, ${LABEL("consulting")} ${pp(F.consultingGap, 1)}로, 단순경비율이 높은 업종일수록 기준경비율로 이기기 위해 증빙해야 할 경비가 커집니다. ` +
        `이 계산기의 승부는 세율표가 아니라 두 경비율의 뺄셈 하나로 정해지고, 주요경비 세 칸의 합이 그 값을 넘는지만 보면 됩니다.`,
    },
    {
      h2: `주요경비 ${manwon(I.majors)}을 고정하면 ${LABEL("it")}의 승자는 매출 ${manwon(F.flip)}에서 뒤집힌다 — 그 아래는 기준경비율, 위는 단순경비율`,
      body:
        `기본값의 주요경비 ${manwon(I.majors)}을 그대로 두고 매출만 ${manwon(I.presetA)}부터 ${manwon(I.presetD)}까지 ${won(I.scanStep)} 단위로 올리면, 단순경비율이 처음 이기는 매출은 ${won(F.flip)}입니다. ` +
        `바로 아래 매출에서는 기준경비율 ${won(F.beforeStd)} 대 단순경비율 ${won(F.beforeSimp)}으로 기준경비율이 앞서고, 프리셋으로 보면 ${manwon(I.presetA)}에서 ${won(F.aStd)} 대 ${won(F.aSimp)}, ${manwon(I.presetB)}에서 ${won(F.bStd)} 대 ${won(F.bSimp)}으로 기준경비율이 이기며, ${manwon(I.revenue)}과 ${manwon(I.presetD)}에서는 단순경비율이 이깁니다. ` +
        `뒤집히는 자리는 주요경비 비율이 첫 발견의 문턱 ${pct(F.itGap, 1)}로 내려오는 매출(${manwon(I.majors)} ÷ ${pct(F.itGap, 1)})이고, 실제로 ${manwon(F.flip)}에서 주요경비 비율은 ${pct(F.flipShare, 1)}입니다. ` +
        `매출이 늘어도 임차료·인건비가 그대로인 사업자라면 어느 해부터 단순경비율이 유리해지는지가 이 한 숫자로 정해집니다.`,
    },
    {
      h2: `기본값 매출 ${manwon(I.revenue)}에서 ${I.industries}개 업종 전부 단순경비율이 이긴다 — 그러나 ${F.overThreshold}개 업종 모두 적용 기준을 넘는 매출이다`,
      body:
        `주요경비 ${manwon(I.majors)}·매출 ${manwon(I.revenue)}으로 업종을 ${I.industries}개 전부 돌리면 단순경비율 쪽 세금이 낮은 업종이 ${F.simpleWins}개로, 차이는 ${LABEL(byDiffKeys[byDiffKeys.length - 1].key)} ${won(F.smallestGap)}에서 ${LABEL(byDiffKeys[0].key)} ${won(F.largestGap)}까지입니다. ` +
        `그런데 업종 표에 적힌 단순경비율 적용 기준(직전 과세기간 수입 ${manwon(I.thresholdDefault)}, ${LABEL("design")}·${LABEL("consulting")}은 ${manwon(I.thresholdLow)})을 매출 ${manwon(I.revenue)}은 ${I.industries}개 업종 모두에서 넘습니다. ` +
        `직전 연도 수입도 같은 수준이었다면 단순경비율 열은 선택지가 아니고, 실제 세금은 기준경비율 열의 값입니다. 계산기는 두 방식을 모두 계산해 보여주지만 적용 가능 여부는 판정하지 않습니다. ` +
        `이 페이지에서 "단순경비율이 유리하다"는 결과를 읽을 때는 표의 적용 기준 열을 먼저 확인해야 하고, 매출 ${manwon(I.thresholdDefault)} 아래로 내려가야 두 열의 비교가 실제 선택이 됩니다.`,
    },
    {
      h2: `같은 매출 ${manwon(I.revenue)}의 단순경비율 세금이 ${LABEL("food")} ${won(F.foodSimpTax)}에서 ${LABEL("consulting")} ${won(F.consultingSimpTax)}까지 — 실효세율 ${times(F.consultingSimpEff, F.foodSimpEff)} 차이`,
      body:
        `단순경비율 방식에서는 매출이 같아도 업종 고시율이 과세소득을 정합니다. ${LABEL("food")}(${pct(I.foodSimple, 1)})은 과세소득 ${won(F.foodSimpTaxable)}에 세금 ${won(F.foodSimpTax)}, 매출 대비 ${pct(F.foodSimpEff, 2)}이고, ` +
        `${LABEL("consulting")}(${pct(I.consultingSimple, 0)})은 과세소득 ${won(F.consultingSimpTaxable)}에 세금 ${won(F.consultingSimpTax)}, ${pct(F.consultingSimpEff, 2)}입니다. 실효세율로 ${times(F.consultingSimpEff, F.foodSimpEff)}입니다. ` +
        `경비율 차이는 ${pp(F.simpleSpread, 1)}인데 세금 차이가 이보다 훨씬 크게 벌어지는 것은 누진세율이 과세소득 차이를 증폭하기 때문입니다. ` +
        `업종 코드가 어느 고시율에 묶이는지는 단순경비율 사업자에게 매출 다음으로 큰 변수이고, 겸업이라면 주업종 판정이 이 표의 두 끝 사이 어디에 세금을 놓을지 정합니다.`,
    },
    {
      h2: `주요경비를 0으로 지우면 ${LABEL("it")} 기준경비율 세금은 ${won(F.stdTax)}에서 ${won(F.noMajorsTax)}으로 — 증빙 ${manwon(I.majors)}의 값은 ${won(F.noMajorsGap)}`,
      body:
        `기본값 기준경비율 방식의 경비 ${won(F.stdExpenses)}은 주요경비 ${manwon(I.majors)}과 매출 × 기준경비율 ${won(F.ratePart)}의 합이고, 주요경비가 기준경비율 부분의 ${times(I.majors, F.ratePart)}입니다. ` +
        `주요경비 세 칸을 모두 0으로 지우면 과세소득은 ${won(F.noMajorsTaxable)}, 세금은 ${won(F.noMajorsTax)}으로 기본값 ${won(F.stdTax)}보다 ${won(F.noMajorsGap)} 늘어납니다. 이 금액이 세금계산서·임대차계약서·급여대장 ${manwon(I.majors)}어치가 지키는 돈입니다. ` +
        `단순경비율 방식에서는 주요경비 칸이 결과에 전혀 영향을 주지 않으므로(경비 ${won(F.simpExpenses)} 고정) 같은 증빙의 값이 0원입니다. ` +
        `기준경비율 사업자에게 증빙은 세금 그 자체이고 단순경비율 사업자에게는 소득세 계산에서 무의미하다는 것이, 두 열이 같은 화면에 있을 때 가장 먼저 읽어야 할 차이입니다.`,
    },
    {
      h2: `같은 주요경비 ${manwon(I.extraMajor)}이 매출 ${manwon(I.revenue)}에서는 ${won(F.extraSaving1)}, ${manwon(I.presetD)}에서는 ${won(F.extraSaving2)}을 줄인다 — ${times(F.extraSaving2, F.extraSaving1)}`,
      body:
        `기준경비율 방식에서 매입비를 ${manwon(I.extraMajor)} 더 넣으면 매출 ${manwon(I.revenue)}에서는 세금이 ${won(F.extraSaving1)}(경비 1원당 ${pct(F.extraRate1, 1)}) 줄고, 매출 ${manwon(I.presetD)}에서는 ${won(F.extraSaving2)}(1원당 ${pct(F.extraRate2, 1)}) 줍니다. ` +
        `같은 영수증의 값이 ${times(F.extraSaving2, F.extraSaving1)} 차이 나는 것은 두 매출의 과세소득이 다른 누진 구간에 놓이기 때문입니다 — 매출 ${manwon(I.revenue)}의 과세소득 ${won(F.stdTaxable)}은 15% 구간, ${manwon(I.presetD)}은 그 위 구간입니다. ` +
        `매출 ${manwon(I.presetD)}에서 두 방식의 차이 ${won(F.dGap)}은 기준경비율 ${won(F.dStd)} 대 단순경비율 ${won(F.dSimp)}으로 매출 ${manwon(I.revenue)} 때의 ${won(F.diff)}보다 훨씬 크지만, 셋째 발견대로 그 매출에서 단순경비율은 선택지가 아닙니다. ` +
        `증빙 수집에 드는 노력이 같다면 그 노력의 세금 가치는 매출이 클수록 크고, 이 계산기는 그 기울기를 두 프리셋 사이에서 보여줍니다.`,
    },
    {
      h2: `${LABEL("food")}은 기본값에서 두 방식 차이가 ${won(F.foodDiff)} — 기준경비율 ${won(F.foodStdTax)} 대 단순경비율 ${won(F.foodSimpTax)}, ${I.industries}개 업종 중 최대`,
      body:
        `단순경비율 ${pct(I.foodSimple, 1)}는 ${I.industries}개 업종 가운데 가장 높고, 같은 주요경비 ${manwon(I.majors)}으로 기준경비율 방식을 쓰면 세금은 ${won(F.foodStdTax)}, 단순경비율이면 ${won(F.foodSimpTax)}으로 차이가 ${won(F.foodDiff)}에 이릅니다. ` +
        `${eun(LABEL("food"))} 단순경비율 문턱(첫 발견)이 매출의 ${pp(F.foodGap, 1)}라, 기준경비율로 이기려면 매출 ${manwon(I.revenue)}에서 주요경비 ${manwon(F.foodThresholdMajors)}을 증빙해야 하는데 기본값 ${manwon(I.majors)}은 그 절반에 못 미칩니다. ` +
        `반대로 차이가 가장 작은 ${eun(LABEL(byDiffKeys[byDiffKeys.length - 1].key))} ${won(F.smallestGap)}으로, 증빙 몇 장이면 순위가 바뀝니다. ` +
        `두 방식의 격차는 업종의 단순경비율이 높을수록 크고, 그만큼 적용 기준 ${manwon(I.thresholdDefault)}을 넘는 순간의 세금 증가도 큽니다 — ${LABEL("food")} 사업자가 매출 성장을 가장 조심스럽게 볼 이유입니다.`,
    },
    {
      h2: `프리셋 ${manwon(I.presetA)}에서 기준경비율 세금은 ${won(F.aStd)} — 주요경비 ${manwon(I.majors)}이 매출의 ${pct(F.aMajorsShare, 0)}라 과세소득이 남지 않는다`,
      body:
        `기본값 주요경비 ${manwon(I.majors)}은 매출 ${manwon(I.presetA)}에서는 ${pct(F.aMajorsShare, 0)}, ${manwon(I.presetB)}에서는 ${pct(F.bMajorsShare, 0)}에 해당합니다. ${manwon(I.presetA)}에서 기준경비율 방식의 경비는 매출을 넘어 과세소득이 0이 되고 세금은 ${won(F.aStd)}입니다. ` +
        `단순경비율은 같은 매출에서 ${won(F.aSimp)}이라 기준경비율이 ${won(F.aAdv)} 유리하고, ${manwon(I.presetB)}에서는 ${won(F.bStd)} 대 ${won(F.bSimp)}으로 ${won(F.bAdv)} 유리합니다. ` +
        `프리셋을 바꿀 때 주요경비 칸이 따라 움직이지 않으므로, 작은 매출 프리셋의 결과는 "매출 ${manwon(I.presetA)}인데 임차료 ${manwon(I.rent)}·인건비 ${manwon(I.labor)}을 쓰는 사업"을 그린 것이고 그 조합은 적자 사업입니다. ` +
        `프리셋 버튼으로 매출만 바꿔 읽으면 두 방식의 비교가 아니라 주요경비 비율의 비교를 보게 되며, 주요경비도 함께 매출에 맞춰 넣어야 두 열이 같은 사업을 가리킵니다.`,
    },
  ],
};
