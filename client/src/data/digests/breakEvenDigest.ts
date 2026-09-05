// /break-even 파생 다이제스트 — 계산기는 고정비·변동비율 한 조합의 손익분기 매출만 보여준다. 여기는
// calcBreakEven을 5업종 변동비율, 고정비 ±10%, 변동비율 ±10%p, 영업일 26·30일로 돌려서만 보이는 것을
// 적는다: 같은 고정비의 업종별 BEP 편차, 고정비 1만원이 요구하는 매출, 변동비율 쪽이 더 민감한 이유,
// 업종 표의 고정비율·변동비율을 함께 넣었을 때 나오는 안전한계율. 산문의 숫자는 F·I에서만 온다.

import { INDUSTRY_EXPENSE_RATIOS } from "../bizConstants";
import { calcBreakEven } from "@/utils/bizBreakEvenCalc";
import { type Digest, eun, manwon, num, pct, pp, times, won } from "./format";

export const BREAK_EVEN_INPUTS = {
  rent: 1_500_000,
  labor: 2_000_000,
  otherFixed: 500_000,
  fixed: 4_000_000,
  days: 26,
  days30: 30,
  varFood: INDUSTRY_EXPENSE_RATIOS.food.variableRatio,
  varCafe: INDUSTRY_EXPENSE_RATIOS.cafe.variableRatio,
  varRetail: INDUSTRY_EXPENSE_RATIOS.retail.variableRatio,
  varService: INDUSTRY_EXPENSE_RATIOS.service.variableRatio,
  varBeauty: INDUSTRY_EXPENSE_RATIOS.beauty.variableRatio,
  fixedFood: INDUSTRY_EXPENSE_RATIOS.food.fixedRatio,
  fixedRetail: INDUSTRY_EXPENSE_RATIOS.retail.fixedRatio,
  fixedBeauty: INDUSTRY_EXPENSE_RATIOS.beauty.fixedRatio,
  bump: 0.1,
  varBump: 0.1,
  varExtreme: 0.9,
  profitTarget: 1_000_000,
  unit: 10_000,
  typicalRevenue: 10_000_000,
};
const I = BREAK_EVEN_INPUTS;
const KEYS = Object.keys(INDUSTRY_EXPENSE_RATIOS);
const label = (k: string) => INDUSTRY_EXPENSE_RATIOS[k].label;
const bep = (fixed: number, v: number, days = I.days) => calcBreakEven(fixed, v, days);

function facts() {
  const byIndustry = KEYS.map((k) => ({ k, r: bep(I.fixed, INDUSTRY_EXPENSE_RATIOS[k].variableRatio) }));
  const sorted = byIndustry.slice().sort((a, b) => a.r.breakEvenRevenue - b.r.breakEvenRevenue);
  const low = sorted[0];
  const high = sorted[sorted.length - 1];
  const food = bep(I.fixed, I.varFood);
  const fixedUp = bep(I.fixed * (1 + I.bump), I.varFood);
  const varUp = bep(I.fixed, I.varFood + I.varBump);
  const food30 = bep(I.fixed, I.varFood, I.days30);
  const perUnit = (v: number) => bep(I.unit, v).breakEvenRevenue;
  const laborHalf = bep(I.fixed - I.labor / 2, I.varFood);
  const rentZero = bep(I.fixed - I.rent, I.varFood);
  const extreme = bep(I.fixed, I.varExtreme);
  const withProfit = bep(I.fixed + I.profitTarget, I.varFood);
  // 표의 고정비율×대표 매출을 고정비로 넣으면 BEP/대표 매출이 업종별 상수가 된다 — 안전한계율
  const safety = (k: string) => 1 - bep(I.typicalRevenue * INDUSTRY_EXPENSE_RATIOS[k].fixedRatio, INDUSTRY_EXPENSE_RATIOS[k].variableRatio).breakEvenRevenue / I.typicalRevenue;
  const bepShare = (k: string) => 1 - safety(k);
  return {
    lowBep: low.r.breakEvenRevenue, highBep: high.r.breakEvenRevenue, spreadRatio: high.r.breakEvenRevenue / low.r.breakEvenRevenue,
    lowDaily: low.r.dailyBreakEvenRevenue, highDaily: high.r.dailyBreakEvenRevenue,
    foodBep: food.breakEvenRevenue, foodDaily: food.dailyBreakEvenRevenue, cafeBep: bep(I.fixed, I.varCafe).breakEvenRevenue, serviceBep: bep(I.fixed, I.varService).breakEvenRevenue,
    fixedUpFixed: I.fixed * (1 + I.bump), fixedUpBep: fixedUp.breakEvenRevenue, fixedUpGain: fixedUp.breakEvenRevenue - food.breakEvenRevenue, fixedUpPct: fixedUp.breakEvenRevenue / food.breakEvenRevenue - 1,
    varUpRate: I.varFood + I.varBump, varUpBep: varUp.breakEvenRevenue, varUpGain: varUp.breakEvenRevenue - food.breakEvenRevenue, varUpPct: varUp.breakEvenRevenue / food.breakEvenRevenue - 1,
    sensitivityRatio: (varUp.breakEvenRevenue - food.breakEvenRevenue) / (fixedUp.breakEvenRevenue - food.breakEvenRevenue),
    daily30: food30.dailyBreakEvenRevenue, dailyDrop: food.dailyBreakEvenRevenue - food30.dailyBreakEvenRevenue, dailyDropPct: 1 - food30.dailyBreakEvenRevenue / food.dailyBreakEvenRevenue,
    unitFood: perUnit(I.varFood), unitCafe: perUnit(I.varCafe), unitRetail: perUnit(I.varRetail), unitService: perUnit(I.varService), unitBeauty: perUnit(I.varBeauty),
    laborHalfFixed: I.fixed - I.labor / 2, laborHalfBep: laborHalf.breakEvenRevenue, laborHalfDrop: food.breakEvenRevenue - laborHalf.breakEvenRevenue,
    laborHalfRatio: (food.breakEvenRevenue - laborHalf.breakEvenRevenue) / (I.labor / 2),
    extremeBep: extreme.breakEvenRevenue, extremeRatio: extreme.breakEvenRevenue / I.fixed, foodRatio: food.breakEvenRevenue / I.fixed,
    profitFixed: I.fixed + I.profitTarget, profitBep: withProfit.breakEvenRevenue, profitExtra: withProfit.breakEvenRevenue - food.breakEvenRevenue,
    profitPerWon: (withProfit.breakEvenRevenue - food.breakEvenRevenue) / I.profitTarget,
    safetyFood: safety("food"), safetyCafe: safety("cafe"), safetyRetail: safety("retail"), safetyService: safety("service"), safetyBeauty: safety("beauty"),
    shareFood: bepShare("food"), shareRetail: bepShare("retail"), shareBeauty: bepShare("beauty"),
    laborShare: I.labor / I.fixed, laborHalf: I.labor / 2,
    rentZeroBep: rentZero.breakEvenRevenue, rentZeroDrop: food.breakEvenRevenue - rentZero.breakEvenRevenue, rentZeroRatio: (food.breakEvenRevenue - rentZero.breakEvenRevenue) / I.rent,
  };
}
const F = facts();
const LOW = KEYS.slice().sort((a, b) => bep(I.fixed, INDUSTRY_EXPENSE_RATIOS[a].variableRatio).breakEvenRevenue - bep(I.fixed, INDUSTRY_EXPENSE_RATIOS[b].variableRatio).breakEvenRevenue);

export const BREAK_EVEN_DIGEST: Digest = {
  facts: F,
  inputs: I,
  findings: [
    {
      h2: `같은 고정비 ${manwon(I.fixed)}으로 손익분기 매출이 ${label(LOW[0])} ${manwon(F.lowBep, 1)}에서 ${label(LOW[LOW.length - 1])} ${manwon(F.highBep, 1)}까지 — ${times(F.highBep, F.lowBep)}`,
      body:
        `기본값 고정비 ${manwon(I.fixed)}(임대료 ${manwon(I.rent)}·인건비 ${manwon(I.labor)}·기타 ${manwon(I.otherFixed)})을 두고 업종 프리셋 다섯 개의 변동비율만 바꾸면 손익분기 매출은 ` +
        `${label(LOW[0])}(변동비율 ${pct(I.varBeauty)}) ${won(F.lowBep)}, ${label("service")} ${won(F.serviceBep)}, ${label("cafe")} ${won(F.cafeBep)}, ${label("food")} ${won(F.foodBep)}, ${label("retail")}(${pct(I.varRetail)}) ${won(F.highBep)} 순입니다. ` +
        `가장 높은 값이 가장 낮은 값의 ${times(F.highBep, F.lowBep)}이고, 하루 목표로 바꾸면 ${won(F.lowDaily)}에서 ${won(F.highDaily)}까지 벌어집니다. ` +
        `고정비는 손도 대지 않았는데 매출 목표가 두 배 가까이 갈리는 것은 변동비율이 분모에 들어가기 때문이며, 그래서 이 계산기에서 업종 선택은 입력 하나가 아니라 결과의 배율입니다.`,
    },
    {
      h2: `${label("food")}에서 변동비율 ${pp(I.varBump)}는 고정비 ${pct(I.bump)}보다 손익분기점을 ${times(F.varUpGain, F.fixedUpGain)} 더 밀어 올린다`,
      body:
        `${label("food")} 기본값의 손익분기 매출 ${won(F.foodBep)}에서 고정비만 ${pct(I.bump)} 올려 ${manwon(F.fixedUpFixed)}으로 두면 ${won(F.fixedUpBep)}으로 ${won(F.fixedUpGain)}(${pct(F.fixedUpPct)}) 오릅니다. ` +
        `고정비는 그대로 두고 변동비율을 ${pct(I.varFood)}에서 ${pct(F.varUpRate)}로 ${pp(I.varBump)} 올리면 ${won(F.varUpBep)}으로 ${won(F.varUpGain)}(${pct(F.varUpPct)}) 오릅니다. ` +
        `고정비의 ${pct(I.bump)}는 손익분기점의 정확히 ${pct(I.bump)}이지만, 변동비율의 ${pp(I.varBump)}는 공헌이익률을 ${pct(1 - I.varFood)}에서 ${pct(1 - F.varUpRate)}로 깎아 ${pct(F.varUpPct)}를 만듭니다. ` +
        `재료비 인상과 임대료 인상이 같은 금액이라도 손익분기점에 미치는 힘은 다르고, 이 계산기에서 더 무거운 쪽은 언제나 변동비율입니다.`,
    },
    {
      h2: `고정비 ${won(I.unit)}이 요구하는 매출은 ${label("beauty")} ${won(F.unitBeauty)}, ${label("food")} ${won(F.unitFood)}, ${label("retail")} ${won(F.unitRetail)}`,
      body:
        `고정비를 ${won(I.unit)}만 넣고 업종을 바꾸면 손익분기 매출이 그 고정비를 갚는 데 필요한 매출로 나옵니다: ${label("beauty")} ${won(F.unitBeauty)}, ${label("service")} ${won(F.unitService)}, ${label("cafe")} ${won(F.unitCafe)}, ${label("food")} ${won(F.unitFood)}, ${label("retail")} ${won(F.unitRetail)}. ` +
        `이 배율은 고정비 크기와 무관하게 일정하므로, 월세가 ${won(I.unit)} 오르면 ${eun(label("retail"))} ${won(F.unitRetail)}, ${eun(label("beauty"))} ${won(F.unitBeauty)}의 매출을 더 올려야 제자리입니다. ` +
        `기본값 인건비 ${manwon(I.labor)}을 절반으로 줄이면 ${label("food")} 손익분기점은 ${won(F.foodBep)}에서 ${won(F.laborHalfBep)}으로 ${won(F.laborHalfDrop)} 내려가는데, 이것도 같은 배율 ${num(F.laborHalfRatio, 2)}의 결과입니다. ` +
        `고정비 항목 세 개 가운데 어느 것을 줄이든 손익분기점에 미치는 효과는 금액이 같으면 같고, 항목의 이름은 변수가 아닙니다.`,
    },
    {
      h2: `영업일을 ${I.days}일에서 ${I.days30}일로 늘리면 하루 목표가 ${won(F.foodDaily)}에서 ${won(F.daily30)}으로 ${pct(F.dailyDropPct, 1)} 내려간다 — 월 목표는 그대로`,
      body:
        `${label("food")} 기본값의 손익분기 매출 ${won(F.foodBep)}은 영업일 수와 무관합니다. 영업일 ${I.days}일이면 하루 ${won(F.foodDaily)}, ${I.days30}일이면 하루 ${won(F.daily30)}으로 ${won(F.dailyDrop)} 줄어듭니다. ` +
        `이 계산기는 영업일이 늘어도 고정비를 그대로 두므로, 휴무일을 영업일로 바꿀 때 추가되는 인건비·재료 손실은 반영되지 않습니다. 하루 목표가 ${pct(F.dailyDropPct, 1)} 내려가는 대신 그 나흘의 변동비는 매출에 비례해 자동으로 빠지지만 고정비 증가는 직접 넣어야 합니다. ` +
        `반대로 정기 휴무를 늘려 ${I.days}일 아래로 내려가면 하루 목표는 같은 폭으로 올라가고, 월 손익분기점 ${won(F.foodBep)}은 여전히 움직이지 않습니다. ` +
        `영업일 슬라이더가 바꾸는 것은 목표의 크기가 아니라 목표를 나누는 단위입니다.`,
    },
    {
      h2: `업종 표의 고정비율·변동비율을 함께 넣으면 안전한계율이 나온다 — ${label("retail")} ${pct(F.safetyRetail, 1)}, ${label("food")} ${pct(F.safetyFood, 1)}, ${label("beauty")} ${pct(F.safetyBeauty, 1)}`,
      body:
        `업종 프리셋에는 변동비율 옆에 이 계산기가 쓰지 않는 고정비율(${label("food")} ${pct(I.fixedFood)}, ${label("retail")} ${pct(I.fixedRetail)}, ${label("beauty")} ${pct(I.fixedBeauty)})이 함께 적혀 있습니다. 매출 ${manwon(I.typicalRevenue)}을 가정하고 고정비율 × 매출을 고정비로 넣으면 손익분기점이 매출의 몇 %인지가 업종별 상수로 나옵니다: ` +
        `${label("food")} ${pct(F.shareFood, 1)}, ${label("retail")} ${pct(F.shareRetail, 1)}, ${label("beauty")} ${pct(F.shareBeauty, 1)}. 이를 1에서 뺀 안전한계율은 ${label("retail")} ${pct(F.safetyRetail, 1)}, ${label("food")} ${pct(F.safetyFood, 1)}, ${label("cafe")} ${pct(F.safetyCafe, 1)}, ${label("service")} ${pct(F.safetyService, 0)}, ${label("beauty")} ${pct(F.safetyBeauty, 1)}입니다. ` +
        `변동비율이 가장 낮아 손익분기점이 가장 낮았던 ${eun(label("beauty"))} 고정비율이 가장 높아 안전한계율에서는 꼴찌가 되고, 손익분기점이 가장 높았던 ${eun(label("retail"))} 고정비율이 가장 낮아 1위가 됩니다. ` +
        `첫 발견의 순위와 정반대이며, 어느 표를 보느냐에 따라 "버티기 쉬운 업종"의 답이 뒤집힙니다.`,
    },
    {
      h2: `변동비율 ${pct(I.varExtreme)}이면 손익분기 매출은 고정비의 ${num(F.extremeRatio, 0)}배 ${manwon(F.extremeBep)} — ${label("food")} ${pct(I.varFood)}의 ${num(F.foodRatio, 2)}배와 견주면 슬라이더 오른쪽 끝의 무게`,
      body:
        `고정비 ${manwon(I.fixed)}에서 변동비율을 ${pct(I.varExtreme)}까지 올리면 손익분기 매출은 ${won(F.extremeBep)}, 고정비의 ${num(F.extremeRatio, 0)}배가 됩니다. ${label("food")} 프리셋 ${pct(I.varFood)}에서는 ${num(F.foodRatio, 2)}배인 ${won(F.foodBep)}입니다. ` +
        `변동비율이 1에 가까워질수록 분모 (1 − 변동비율)이 0에 가까워져 손익분기점이 급격히 커지고, 계산기는 변동비율이 1 이상이면 0을 돌려줍니다 — 매출로는 절대 고정비를 갚을 수 없다는 뜻입니다. ` +
        `슬라이더 왼쪽 절반(${pct(I.varFood)} 이하)에서는 손익분기점이 고정비의 ${num(F.foodRatio, 2)}배 아래에서 완만하게 움직이고, 오른쪽 끝으로 갈수록 한 칸이 훨씬 큽니다. ` +
        `배달 수수료처럼 매출에 비례해 붙는 비용을 변동비에 더하는 순간 이 오른쪽 구간으로 이동하므로, 배달 비중이 큰 매장은 같은 고정비에서도 손익분기점이 프리셋보다 훨씬 위에 있습니다.`,
    },
    {
      h2: `${label("food")}에서 월 ${manwon(I.profitTarget)} 이익을 남기려면 손익분기점에 ${won(F.profitExtra)}을 더 팔아야 한다 — 이익 1원당 매출 ${num(F.profitPerWon, 2)}원`,
      body:
        `목표 이익을 고정비에 더해 넣으면 계산기가 "이익 포함 손익분기점"을 냅니다. 고정비 ${manwon(I.fixed)}에 ${manwon(I.profitTarget)}을 더해 ${manwon(F.profitFixed)}으로 두면 ${label("food")} 손익분기 매출은 ${won(F.foodBep)}에서 ${won(F.profitBep)}으로 ${won(F.profitExtra)} 오릅니다. ` +
        `이익 1원마다 매출 ${num(F.profitPerWon, 2)}원이 필요하고 이 배율은 세 번째 발견의 고정비 배율과 같습니다 — 계산기 안에서 목표 이익과 고정비는 구분되지 않기 때문입니다. ` +
        `반대로 읽으면 손익분기점을 넘긴 매출 1원 가운데 ${pct(1 - I.varFood)}만 이익으로 남고 나머지 ${pct(I.varFood)}는 변동비로 빠지므로, ${manwon(I.profitTarget)}을 남기려면 넘긴 매출이 ${won(F.profitExtra)}이어야 합니다. ` +
        `월 목표 이익을 정해 두고 그 금액을 고정비 칸에 더하는 것이 이 계산기로 목표 매출을 얻는 가장 짧은 방법입니다.`,
    },
    {
      h2: `기본 고정비의 ${pct(F.laborShare)}가 인건비다 — 절반을 줄이면 ${label("food")} 손익분기점이 ${won(F.laborHalfDrop)}, 임대료를 없애면 ${won(F.rentZeroDrop)} 내려간다`,
      body:
        `기본값 고정비 ${manwon(I.fixed)} 가운데 인건비가 ${manwon(I.labor)}으로 ${pct(F.laborShare)}, 임대료가 ${manwon(I.rent)}, 기타가 ${manwon(I.otherFixed)}입니다. ` +
        `인건비를 절반인 ${manwon(F.laborHalf)}으로 줄이면 고정비는 ${manwon(F.laborHalfFixed)}이 되고 ${label("food")} 손익분기 매출은 ${won(F.laborHalfBep)}, 기본값보다 ${won(F.laborHalfDrop)} 낮습니다. ` +
        `임대료 ${manwon(I.rent)}을 통째로 없애면 ${won(F.rentZeroBep)}으로 ${won(F.rentZeroDrop)} 내려가는데, 두 하락폭을 줄인 고정비로 나누면 ${num(F.laborHalfRatio, 2)}와 ${num(F.rentZeroRatio, 2)}로 같습니다 — 어느 항목을 줄이든 고정비 1원의 값은 같습니다. ` +
        `인건비 계산기에서 확인할 수 있듯 급여 ${manwon(I.labor)}의 실제 사업주 부담은 4대보험과 퇴직급여를 얹어 더 크므로, 인건비 칸에 세전 급여만 넣은 손익분기점은 실제보다 낮게 나옵니다.`,
    },
  ],
};
