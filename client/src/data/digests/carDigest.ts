// /car-expense 파생 다이제스트 — 계산기는 차량비·업무 사용비율·세율 한 조합의 손금·절세액만 보여준다.
// 여기는 calculateCarExpenseDeduction을 세율 슬라이더 6~50%, 사용비율 10~100%, 차량비 전 구간 돌려서만
// 보이는 것을 적는다: 두 슬라이더의 배율 비교, 지방소득세를 빠뜨렸을 때의 차액, FAQ의 1,500만원
// 한도를 계산기가 적용하지 않는다는 사실, 같은 절세액을 만드는 다른 조합. 산문의 숫자는 F·I에서만 온다.

import { CORP_TAX_BRACKETS, INCOME_TAX_BRACKETS, LOCAL_INCOME_TAX_RATE } from "../bizConstants";
import { calculateCarExpenseDeduction } from "@/utils/bizExpansionCalc";
import { type Digest, manwon, num, pct, pp, won } from "./format";

export const CAR_INPUTS = {
  defaultCost: 12_000_000,
  defaultUse: 0.8,
  defaultRate: 0.24,
  rateMin: 0.06,
  rateMax: 0.5,
  useMin: 0.1,
  useMax: 1,
  useHalf: 0.5,
  useJustUnder: 0.79,
  useStep: 0.1,
  rateNext: INCOME_TAX_BRACKETS[3].rate,
  corpRate: CORP_TAX_BRACKETS[0].rate, // 명목 법인세율(지방소득세 별도) — 아래에서 지방소득세를 얹는다
  localSurtax: LOCAL_INCOME_TAX_RATE,
  faqLimit: 15_000_000,
  costStep: 10_000,
  costMax: 30_000_000,
  altUse: 0.8,
  altRate: 0.3,
  unit: 10_000,
};
const I = CAR_INPUTS;
const run = (annualCost: number, businessUseRate: number, taxRate: number) => {
  const r = calculateCarExpenseDeduction({ annualCost, businessUseRate, taxRate });
  if (!r.success) throw new Error(`car expense failed at ${annualCost}/${businessUseRate}/${taxRate}`);
  return r.data;
};

/** 기본 사용비율에서 손금 인정액이 FAQ 한도에 처음 닿는 연간 차량비 (1만원 단위) */
export function costReachingLimit(): number {
  for (let c = I.defaultCost; c <= I.costMax; c += I.costStep) if (run(c, I.defaultUse, I.defaultRate).deductibleAmount >= I.faqLimit) return c;
  return Number.NaN;
}

function facts() {
  const d = run(I.defaultCost, I.defaultUse, I.defaultRate);
  const rMin = run(I.defaultCost, I.defaultUse, I.rateMin);
  const rMax = run(I.defaultCost, I.defaultUse, I.rateMax);
  const uMin = run(I.defaultCost, I.useMin, I.defaultRate);
  const uMax = run(I.defaultCost, I.useMax, I.defaultRate);
  const uHalf = run(I.defaultCost, I.useHalf, I.defaultRate);
  const uStepUp = run(I.defaultCost, I.defaultUse + I.useStep, I.defaultRate);
  const withLocal = run(I.defaultCost, I.defaultUse, I.defaultRate * (1 + I.localSurtax));
  const corp = run(I.defaultCost, I.defaultUse, I.corpRate * (1 + I.localSurtax));
  const next = run(I.defaultCost, I.defaultUse, I.rateNext);
  const limitCost = costReachingLimit();
  const atLimit = run(limitCost, I.defaultUse, I.defaultRate);
  const overLimit = run(limitCost + I.costStep * 100, I.defaultUse, I.defaultRate);
  const unit = run(I.unit * 100, I.defaultUse, I.defaultRate);
  const alt = run(I.defaultCost, I.altUse, I.altRate);
  const justUnder = run(I.defaultCost, I.useJustUnder, I.defaultRate);
  return {
    deductible: d.deductibleAmount, nonDeductible: d.nonDeductibleAmount, saving: d.taxSaving,
    savingMin: rMin.taxSaving, savingMax: rMax.taxSaving, rateSpan: rMax.taxSaving / rMin.taxSaving,
    savingUseMin: uMin.taxSaving, savingUseMax: uMax.taxSaving, useSpan: uMax.taxSaving / uMin.taxSaving,
    perStepDeductible: uStepUp.deductibleAmount - d.deductibleAmount, perStepSaving: uStepUp.taxSaving - d.taxSaving,
    halfNon: uHalf.nonDeductibleAmount, halfSaving: uHalf.taxSaving, halfDrop: d.taxSaving - uHalf.taxSaving,
    localRate: I.defaultRate * (1 + I.localSurtax), withLocalSaving: withLocal.taxSaving, localGap: withLocal.taxSaving - d.taxSaving,
    corpLocalRate: I.corpRate * (1 + I.localSurtax), corpSaving: corp.taxSaving, corpGap: d.taxSaving - corp.taxSaving,
    nextSaving: next.taxSaving, nextGap: next.taxSaving - d.taxSaving,
    limitCost, limitDeductible: atLimit.deductibleAmount, limitSaving: atLimit.taxSaving,
    overCost: limitCost + I.costStep * 100, overDeductible: overLimit.deductibleAmount, overExcess: overLimit.deductibleAmount - I.faqLimit,
    unitCost: I.unit * 100, unitSaving: unit.taxSaving / 100, unitOut: I.unit - unit.taxSaving / 100,
    unitSavingMax: run(I.unit * 100, I.useMax, I.rateMax).taxSaving / 100,
    altSaving: alt.taxSaving, altDeductible: alt.deductibleAmount, altUseGap: I.useMax - I.altUse, altRateGap: I.altRate - I.defaultRate,
    justUnderDeductible: justUnder.deductibleAmount, justUnderGap: d.deductibleAmount - justUnder.deductibleAmount,
    nonShare: d.nonDeductibleAmount / I.defaultCost, savingShare: d.taxSaving / I.defaultCost,
    halfNonRatio: uHalf.nonDeductibleAmount / d.nonDeductibleAmount, useMinDeductible: uMin.deductibleAmount, useMinNon: uMin.nonDeductibleAmount,
    maxShare: rMax.taxSaving / I.defaultCost, overstate80: I.defaultRate - d.taxSaving / I.defaultCost, overstate50: I.defaultRate - uHalf.taxSaving / I.defaultCost,
  };
}
const F = facts();
const advice = (use: number) => run(I.defaultCost, use, I.defaultRate).logbookAdvice;

export const CAR_DIGEST: Digest = {
  facts: F,
  inputs: I,
  findings: [
    {
      h2: `세율 슬라이더(${pct(I.rateMin)}→${pct(I.rateMax)})는 절세액을 ${num(F.rateSpan, 1)}배, 사용비율 슬라이더(${pct(I.useMin)}→${pct(I.useMax)})는 ${num(F.useSpan, 0)}배 움직인다`,
      body:
        `기본값 차량비 ${manwon(I.defaultCost)}·사용비율 ${pct(I.defaultUse)}에서 세율만 ${pct(I.rateMin)}부터 ${pct(I.rateMax)}까지 옮기면 절세액은 ${won(F.savingMin)}에서 ${won(F.savingMax)}까지 ${num(F.rateSpan, 1)}배 움직입니다. ` +
        `세율을 ${pct(I.defaultRate)}에 두고 사용비율을 ${pct(I.useMin)}부터 ${pct(I.useMax)}까지 옮기면 ${won(F.savingUseMin)}에서 ${won(F.savingUseMax)}까지 ${num(F.useSpan, 0)}배입니다. ` +
        `두 슬라이더는 절세액에 곱으로 들어가므로 한쪽을 반으로 줄이면 다른 쪽을 두 배로 올려야 제자리이고, 사용비율 ${pp(I.useStep)}마다 손금이 ${won(F.perStepDeductible)}, 절세액이 ${won(F.perStepSaving)}씩 늘어납니다. ` +
        `사용비율은 운행기록으로 입증하는 값이고 세율은 다른 소득이 정하는 값이라, 이 계산기에서 사장이 직접 움직일 수 있는 손잡이는 왼쪽 하나입니다.`,
    },
    {
      h2: `세율 칸에 ${pct(I.defaultRate)}를 넣으면 ${won(F.saving)}, 지방소득세를 얹은 ${pct(F.localRate)}를 넣으면 ${won(F.withLocalSaving)} — ${won(F.localGap)}이 빠져 있다`,
      body:
        `종합소득세율 ${pct(I.defaultRate)}에는 그 10%인 지방소득세가 따로 붙어 실제 한계세율은 ${pct(F.localRate)}입니다. 기본값 세율 ${pct(I.defaultRate)}로 계산한 절세액 ${won(F.saving)}과 ${pct(F.localRate)}로 계산한 ${won(F.withLocalSaving)}의 차이 ${won(F.localGap)}이 지방소득세 몫입니다. ` +
        `법인이라면 법인세 ${pct(I.corpRate)}에 지방소득세를 얹은 ${pct(F.corpLocalRate)}가 첫 구간 세율이고, 같은 차량비의 절세액은 ${won(F.corpSaving)}으로 개인 ${pct(I.defaultRate)} 구간보다 ${won(F.corpGap)} 적습니다. ` +
        `한 구간 위인 ${pct(I.rateNext)}로 올리면 ${won(F.nextSaving)}, 기본값보다 ${won(F.nextGap)} 많습니다 — 법인 첫 구간의 절세액 ${won(F.corpSaving)}과 정확히 같은 금액입니다. ` +
        `세율 칸에는 명목 세율이 아니라 지방소득세를 포함한 실제 한계세율을 넣어야 절세액이 실제에 맞습니다.`,
    },
    {
      h2: `이 계산기는 FAQ의 연 ${manwon(I.faqLimit)} 한도를 적용하지 않는다 — 사용비율 ${pct(I.defaultUse)}에서 차량비 ${manwon(F.limitCost)}부터 한도에 닿는다`,
      body:
        `아래 FAQ는 업무용 승용차 관련 비용의 손금 한도를 연 ${manwon(I.faqLimit)}으로 안내하지만, 계산 엔진은 차량비 × 사용비율을 상한 없이 손금으로 인정합니다. ` +
        `사용비율 ${pct(I.defaultUse)}에서 손금이 ${manwon(I.faqLimit)}에 처음 닿는 차량비를 ${won(I.costStep)} 단위로 찾으면 ${won(F.limitCost)}(손금 ${won(F.limitDeductible)}, 절세 ${won(F.limitSaving)})이고, ` +
        `차량비를 ${manwon(F.overCost)}으로 올리면 계산기는 손금 ${won(F.overDeductible)}을 표시해 한도를 ${won(F.overExcess)} 넘깁니다. 기본값 ${manwon(I.defaultCost)}은 한도 안에 있어 결과가 실제와 맞지만, ${manwon(F.limitCost)}을 넘는 고가 차량은 표시된 절세액보다 실제가 작습니다. ` +
        `감가상각비 한도와 운행기록 요건은 별개로 적용되므로, 이 페이지의 숫자는 한도 이하 구간의 참고값으로 읽어야 합니다.`,
    },
    {
      h2: `차량비 ${won(I.unit)}마다 절세는 ${won(F.unitSaving)}, 그대로 나가는 돈은 ${won(F.unitOut)} — 슬라이더 둘을 끝까지 올려도 ${won(F.unitSavingMax)}`,
      body:
        `기본값 사용비율 ${pct(I.defaultUse)}·세율 ${pct(I.defaultRate)}에서 차량비 ${won(I.unit)}이 늘면 손금은 그 ${pct(I.defaultUse)}, 절세는 손금의 ${pct(I.defaultRate)}이므로 실제로 돌아오는 돈은 ${won(F.unitSaving)}이고 ${won(F.unitOut)}은 사장 지갑에서 그대로 나갑니다. ` +
        `사용비율 ${pct(I.useMax)}·세율 ${pct(I.rateMax)}로 두 슬라이더를 끝까지 올려도 ${won(I.unit)}당 절세는 ${won(F.unitSavingMax)}에 그치고 나머지 절반은 여전히 지출입니다. ` +
        `기본값 ${manwon(I.defaultCost)} 전체로 보면 절세 ${won(F.saving)}은 차량비의 ${pct(F.savingShare)}이고, 사적 사용분 ${won(F.nonDeductible)}(${pct(F.nonShare)})은 절세 효과가 0입니다. ` +
        `"경비 처리되니 차를 바꿔도 된다"는 계산은 이 ${pct(F.savingShare)}를 ${pct(I.useMax)}로 읽는 착각이며, 계산기의 절세액 열은 그 착각의 크기를 보여줍니다.`,
    },
    {
      h2: `사용비율 ${pct(I.useJustUnder)}와 ${pct(I.defaultUse)}는 손금이 ${won(F.justUnderGap)} 차이인데 안내 문구가 바뀐다`,
      body:
        `사용비율 ${pct(I.useJustUnder)}에서 손금은 ${won(F.justUnderDeductible)}, ${pct(I.defaultUse)}에서 ${won(F.deductible)}으로 ${won(F.justUnderGap)} 차이지만, 계산기의 안내는 ${pct(I.useJustUnder)}에서 "${advice(I.useJustUnder)}", ${pct(I.defaultUse)}부터 "${advice(I.defaultUse)}"로 갈립니다. ` +
        `${pct(I.defaultUse)}는 금액의 경계가 아니라 입증 방식의 경계입니다. 업무 사용비율이 높을수록 손금은 커지지만 그 비율을 뒷받침할 운행기록의 무게도 같이 커지며, 이 문구는 그 전환점을 표시합니다. ` +
        `사용비율 ${pct(I.useHalf)}로 내리면 사적 사용분이 ${won(F.halfNon)}으로 불어나 절세액은 ${won(F.halfSaving)}, 기본값보다 ${won(F.halfDrop)} 줄어듭니다. ` +
        `절세액 ${won(F.halfDrop)}과 운행기록부 작성 부담 가운데 어느 쪽이 큰지가 이 계산기가 던지는 실제 질문입니다.`,
    },
    {
      h2: `사용비율 ${pct(I.altUse)}·세율 ${pct(I.altRate)}와 사용비율 ${pct(I.useMax)}·세율 ${pct(I.defaultRate)}는 절세액이 ${won(F.altSaving)}으로 같다`,
      body:
        `절세액은 차량비 × 사용비율 × 세율이므로 곱이 같은 조합은 같은 답을 냅니다. 기본값 차량비 ${manwon(I.defaultCost)}에서 사용비율 ${pct(I.useMax)}·세율 ${pct(I.defaultRate)}는 ${won(F.savingUseMax)}, 사용비율 ${pct(I.altUse)}·세율 ${pct(I.altRate)}는 ${won(F.altSaving)}으로 같습니다. ` +
        `사용비율이 ${pp(F.altUseGap)} 낮아진 것을 세율 ${pp(F.altRateGap)}가 정확히 메우는데, 손금 자체는 ${won(F.deductible)}과 ${won(I.defaultCost)}으로 다릅니다 — 손금은 사용비율만의 함수이고 절세액만 세율을 곱합니다. ` +
        `높은 세율 구간의 사업자는 낮은 사용비율로도 같은 절세액을 얻지만 사적 사용분은 그만큼 커지므로, 두 조합의 실제 부담은 손금 열을 봐야 갈립니다. ` +
        `절세액 하나만 보고 조합을 고르면 사적 사용분 ${won(F.nonDeductible)}의 차이를 놓칩니다.`,
    },
    {
      h2: `기본값에서 사적 사용분 ${won(F.nonDeductible)}은 차량비의 ${pct(F.nonShare)} — 사용비율을 ${pct(I.useHalf)}로 내리면 ${won(F.halfNon)}으로 ${num(F.halfNonRatio, 1)}배`,
      body:
        `손금 인정액 ${won(F.deductible)}과 사적 사용분 ${won(F.nonDeductible)}은 항상 합쳐서 차량비 ${manwon(I.defaultCost)}이고, 계산기의 막대는 그 비율을 그립니다. 사용비율 ${pct(I.defaultUse)}에서 사적 사용분은 ${pct(F.nonShare)}, ${pct(I.useHalf)}에서는 ${pct(1 - I.useHalf)}입니다. ` +
        `사적 사용분은 세금 계산에서 사라지는 돈이 아니라 세전 이익에서 나가는 돈이므로, 이 금액이 커질수록 같은 차량비의 실제 비용은 절세액 감소분 ${won(F.halfDrop)}보다 훨씬 크게 늘어납니다. ` +
        `사용비율 ${pct(I.useMin)}에서는 손금 ${won(F.useMinDeductible)}, 사적 사용분 ${won(F.useMinNon)}으로 차량비의 ${pct(1 - I.useMin)}가 회사 장부 밖의 지출이 됩니다. ` +
        `사적 사용분 열은 이 계산기에서 유일하게 "세금과 무관한 돈"을 보여주는 열이며, 절세액보다 먼저 봐야 할 숫자입니다.`,
    },
    {
      h2: `절세액 ${won(F.saving)}은 손금 ${won(F.deductible)}의 ${pct(I.defaultRate)}이지 차량비의 ${pct(I.defaultRate)}가 아니다 — 차량비 대비로는 ${pct(F.savingShare)}`,
      body:
        `기본값에서 절세액 ${won(F.saving)}을 차량비 ${manwon(I.defaultCost)}으로 나누면 ${pct(F.savingShare)}입니다. 세율 ${pct(I.defaultRate)}가 사용비율 ${pct(I.defaultUse)}에 곱해져 나온 값이며, 사용비율이 ${pct(I.useMax)}일 때만 절세율이 세율과 같아집니다. ` +
        `같은 이유로 세율 ${pct(I.rateMax)} 구간의 사업자도 사용비율 ${pct(I.defaultUse)}에서는 차량비의 ${pct(F.maxShare)}만 돌려받습니다(${won(F.savingMax)}). ` +
        `절세액을 차량비의 세율 배로 어림하는 습관은 사용비율 ${pct(I.defaultUse)}에서 ${pp(F.overstate80)}, ${pct(I.useHalf)}에서 ${pp(F.overstate50)}를 과대평가합니다. ` +
        `차량비 결정을 절세액 열에서 시작한다면 그 열의 분모가 손금이라는 점을 먼저 확인해야 합니다.`,
    },
  ],
};
