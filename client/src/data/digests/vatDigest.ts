// /vat-compare 파생 다이제스트 — 계산기는 매출·업종·매입 비율 한 조합의 부가세만 보여준다. 여기는
// calcVatCompare를 6업종 × 매입 0~100% × 매출 3천만~1억 400만 전 구간 돌려서만 보이는 것을 적는다:
// 일반과세가 간이과세를 역전하는 매입 비율, 4,800만·1억 400만 경계의 1만원, 임대·유흥업의 빈 창.
// 세율 한 줄을 옮겨 적는 문장은 발견이 아니다. 산문의 숫자는 F(엔진 실행값)·I(입력값)에서만 온다.

import {
  DEFAULT_SIMPLIFIED_TAX_THRESHOLD,
  SIMPLIFIED_TAX_EXEMPT_THRESHOLD,
  SIMPLIFIED_VAT_RATES,
  SPECIAL_SIMPLIFIED_TAX_THRESHOLD,
} from "../bizConstants";
import { calcVatCompare } from "@/utils/bizVatCalc";
import { type Digest, eun, manwon, pct, pp, times, won } from "./format";

export const VAT_INPUTS = {
  defaultRevenue: 80_000_000,
  defaultPurchase: 0.4,
  presetA: 30_000_000,
  presetB: 50_000_000,
  presetD: 100_000_000,
  exemptThreshold: SIMPLIFIED_TAX_EXEMPT_THRESHOLD,
  eligibilityThreshold: DEFAULT_SIMPLIFIED_TAX_THRESHOLD,
  specialThreshold: SPECIAL_SIMPLIFIED_TAX_THRESHOLD,
  fineStep: 10_000,
  purchaseStep: 0.01,
  purchaseHigh: 0.8,
  purchaseZero: 0,
  rateRetail: SIMPLIFIED_VAT_RATES.retail.rate,
  rateManufacturing: SIMPLIFIED_VAT_RATES.manufacturing.rate,
  rateService: SIMPLIFIED_VAT_RATES.service.rate,
  rateRealestate: SIMPLIFIED_VAT_RATES.realestate.rate,
};
const I = VAT_INPUTS;
const KEYS = Object.keys(SIMPLIFIED_VAT_RATES);
const label = (key: string) => SIMPLIFIED_VAT_RATES[key].label;

/** 일반과세가 간이과세보다 유리해지기 시작하는 매입 비율 (1%p 단위). 동률은 엔진이 간이로 판정한다. */
export function flipPurchaseRate(industryKey: string, revenue = I.defaultRevenue): number {
  for (let k = 0; k <= 100; k += 1) {
    const p = Number((k * I.purchaseStep).toFixed(2));
    if (calcVatCompare(revenue, industryKey, p).recommendation === "general") return p;
  }
  return Number.NaN;
}

function facts() {
  const food = calcVatCompare(I.defaultRevenue, "food", I.defaultPurchase);
  const flips = Object.fromEntries(KEYS.map((k) => [k, flipPurchaseRate(k)]));
  // 역전 매입 비율이 매출과 무관한지 — 면제선 위·일반 상한 아래의 세 매출에서 같은 값이 나오는 업종 수
  // (면제선 아래에서는 간이 세액이 0이라 역전점 자체가 없고, 임대·유흥업은 상한이 면제선과 같아 제외)
  const GENERAL_KEYS = KEYS.filter((k) => SIMPLIFIED_VAT_RATES[k].eligibilityThreshold === DEFAULT_SIMPLIFIED_TAX_THRESHOLD);
  const invariant = GENERAL_KEYS.filter((k) =>
    [I.presetB, I.defaultRevenue, I.presetD].every((r) => flipPurchaseRate(k, r) === flips[k]),
  ).length;
  const generalCount = GENERAL_KEYS.length;
  const justUnderExempt = calcVatCompare(I.exemptThreshold - I.fineStep, "food", I.defaultPurchase);
  const atExempt = calcVatCompare(I.exemptThreshold, "food", I.defaultPurchase);
  const serviceAtExempt = calcVatCompare(I.exemptThreshold, "service", I.defaultPurchase);
  const manufAtExempt = calcVatCompare(I.exemptThreshold, "manufacturing", I.defaultPurchase);
  const justUnderCeil = calcVatCompare(I.eligibilityThreshold - I.fineStep, "food", I.defaultPurchase);
  const atCeil = calcVatCompare(I.eligibilityThreshold, "food", I.defaultPurchase);
  const reUnder = calcVatCompare(I.specialThreshold - I.fineStep, "realestate", I.defaultPurchase);
  const reAt = calcVatCompare(I.specialThreshold, "realestate", I.defaultPurchase);
  const simpAll = KEYS.map((k) => calcVatCompare(I.defaultRevenue, k, I.defaultPurchase).simplifiedVat);
  const genAll = KEYS.map((k) => calcVatCompare(I.defaultRevenue, k, I.defaultPurchase).generalVat);
  const ladder = [0, 0.2, 0.4, 0.6, 0.8].map((p) => calcVatCompare(I.defaultRevenue, "food", p).generalVat);
  const highUnderExempt = calcVatCompare(I.exemptThreshold - I.fineStep, "food", I.purchaseHigh);
  const serviceCeil = calcVatCompare(I.eligibilityThreshold - I.fineStep, "service", I.defaultPurchase);
  const zeroCeil = calcVatCompare(I.eligibilityThreshold - I.fineStep, "food", I.purchaseZero);
  return {
    exemptUnder: I.exemptThreshold - I.fineStep, ceilUnder: I.eligibilityThreshold - I.fineStep, specialUnder: I.specialThreshold - I.fineStep,
    flipRetail: flips.retail, flipManufacturing: flips.manufacturing, flipService: flips.service, flipRealestate: flips.realestate,
    flipRetailPrev: flips.retail - I.purchaseStep, invariant, generalCount, industryCount: KEYS.length,
    foodGeneral: food.generalVat, foodSimplified: food.simplifiedVat, foodGap: food.difference, foodRatio: food.generalVat / food.simplifiedVat,
    foodGeneralShare: food.generalVat / I.defaultRevenue, foodSimplifiedShare: food.simplifiedVat / I.defaultRevenue,
    simpSpread: Math.max(...simpAll) - Math.min(...simpAll),
    foodGapToFlip: flips.food - I.defaultPurchase,
    underExemptGeneral: justUnderExempt.generalVat, underExemptSimplified: justUnderExempt.simplifiedVat,
    atExemptSimplified: atExempt.simplifiedVat, atExemptGeneral: atExempt.generalVat,
    serviceAtExempt: serviceAtExempt.simplifiedVat, manufAtExempt: manufAtExempt.simplifiedVat,
    underCeilSimplified: justUnderCeil.simplifiedVat, underCeilGeneral: justUnderCeil.generalVat,
    ceilGeneral: atCeil.generalVat, ceilJump: atCeil.generalVat - justUnderCeil.simplifiedVat, cliffRatio: (atCeil.generalVat - justUnderCeil.simplifiedVat) / atExempt.simplifiedVat,
    reUnderSimplified: reUnder.simplifiedVat, reAtSimplified: reAt.simplifiedVat,
    genSame: genAll[0], genSpread: Math.max(...genAll) - Math.min(...genAll),
    simpMin: Math.min(...simpAll), simpMax: Math.max(...simpAll), simpRatio: Math.max(...simpAll) / Math.min(...simpAll),
    ladder0: ladder[0], ladder20: ladder[1], ladder40: ladder[2], ladder60: ladder[3], ladder80: ladder[4],
    ladderStep: ladder[0] - ladder[1], ladderStepShare: (ladder[0] - ladder[1]) / I.defaultRevenue,
    highUnderExemptGeneral: highUnderExempt.generalVat,
    serviceCeilSimplified: serviceCeil.simplifiedVat, zeroCeilGeneral: zeroCeil.generalVat,
    ceilRatio: zeroCeil.generalVat / serviceCeil.simplifiedVat, ceilLoss: zeroCeil.generalVat - serviceCeil.simplifiedVat,
    ladderHalfStep: (ladder[0] - ladder[1]) / 2, ladderHalfShare: (ladder[0] - ladder[1]) / I.defaultRevenue / 2,
  };
}
const F = facts();

export const VAT_DIGEST: Digest = {
  facts: F,
  inputs: I,
  findings: [
    {
      h2: `일반과세가 간이과세를 역전하는 매입 비율은 ${label("retail")} ${pct(F.flipRetail)}·${label("manufacturing")} ${pct(F.flipManufacturing)}·${label("service")} ${pct(F.flipService)} — 매출을 바꿔도 안 움직인다`,
      body:
        `매입 비율을 ${pp(I.purchaseStep)}씩 올리며 두 부가세를 비교하면 ${label("retail")}·${label("food")}은 ${pct(F.flipRetail)}부터, ${label("manufacturing")}은 ${pct(F.flipManufacturing)}부터, ${label("service")}은 ${pct(F.flipService)}부터 일반과세 쪽이 낮아집니다. ` +
        `역전점은 업종의 부가가치율을 1에서 뺀 값과 같아서, 매출을 ${manwon(I.presetB)}·${manwon(I.defaultRevenue)}·${manwon(I.presetD)}으로 바꿔 다시 훑어도 일반 상한을 쓰는 ${F.generalCount}업종 중 ${F.invariant}업종, 즉 전부에서 같은 비율이 나옵니다. ` +
        `즉 "매출이 얼마면 일반과세가 낫다"는 질문은 이 계산기 안에서 성립하지 않고, 답은 오직 매입 비율이 부가가치율의 보수(${label("retail")} ${pct(F.flipRetail)})를 넘느냐로 정해집니다. ` +
        `동률인 ${pct(F.flipRetailPrev)}에서는 엔진이 간이과세를 권하므로, 실제로 일반과세를 고를 이유가 생기는 최소 매입 비율은 ${pct(F.flipRetail)}입니다.`,
    },
    {
      h2: `기본값(${label("food")}·${manwon(I.defaultRevenue)}·매입 ${pct(I.defaultPurchase)})에서 일반과세는 간이과세의 ${times(F.foodGeneral, F.foodSimplified)} — 격차를 없애려면 매입을 ${pp(F.foodGapToFlip)} 더 올려야 한다`,
      body:
        `기본값에서 일반과세 부가세는 ${won(F.foodGeneral)}, 간이과세는 ${won(F.foodSimplified)}으로 연 ${won(F.foodGap)} 차이가 납니다. ` +
        `일반과세 세액은 매출의 ${pct(F.foodGeneralShare)}인데 간이과세는 ${pct(F.foodSimplifiedShare)}라, 같은 매출에서 ${times(F.foodGeneral, F.foodSimplified)}가 벌어집니다. ` +
        `이 격차를 매입 세금계산서만으로 메우려면 매입 비율이 지금의 ${pct(I.defaultPurchase)}에서 ${pp(F.foodGapToFlip)} 더 올라 ${pct(F.flipRetail)}에 닿아야 하므로, ` +
        `${label("food")}처럼 원재료 외 인건비·임차료 비중이 큰 업종은 매출 ${manwon(I.eligibilityThreshold)} 아래에서 간이과세를 놓칠 이유가 사실상 없습니다.`,
    },
    {
      h2: `매출 ${manwon(F.exemptUnder)}과 ${manwon(I.exemptThreshold)}의 차이는 ${won(I.fineStep)}인데 간이과세 부가세는 ${won(F.underExemptSimplified)}에서 ${won(F.atExemptSimplified)}으로 뛴다`,
      body:
        `간이과세 납부 면제선 ${manwon(I.exemptThreshold)} 바로 아래인 ${manwon(F.exemptUnder)}에서는 ${label("food")} 간이과세 부가세가 ${won(F.underExemptSimplified)}이고, ${won(I.fineStep)}을 더 벌어 ${manwon(I.exemptThreshold)}이 되는 순간 ${won(F.atExemptSimplified)}이 됩니다. ` +
        `같은 자리에서 ${eun(label("manufacturing"))} ${won(F.manufAtExempt)}, ${eun(label("service"))} ${won(F.serviceAtExempt)}으로, 절벽의 높이는 부가가치율에 비례합니다. ` +
        `면제선 바로 아래의 일반과세 부가세는 매입 ${pct(I.defaultPurchase)} 기준 ${won(F.underExemptGeneral)}, 매입 ${pct(I.purchaseHigh)}로 올려도 ${won(F.highUnderExemptGeneral)}이라 면제 구간의 실제 이점은 이 금액 전부입니다. ` +
        `연말 매출이 ${manwon(I.exemptThreshold)} 언저리라면 ${won(I.fineStep)}의 매출이 ${won(F.atExemptSimplified)}의 세금을 부르는 유일한 구간입니다.`,
    },
    {
      h2: `${manwon(I.eligibilityThreshold)} 경계에서 ${label("food")} 부가세는 ${won(F.underCeilSimplified)}에서 ${won(F.ceilGeneral)}으로 — ${won(I.fineStep)} 매출에 ${won(F.ceilJump)}`,
      body:
        `간이과세 적용 상한 ${manwon(I.eligibilityThreshold)} 바로 아래 ${manwon(F.ceilUnder)}에서는 ${label("food")} 간이과세 부가세가 ${won(F.underCeilSimplified)}이고 일반과세는 ${won(F.underCeilGeneral)}입니다. ` +
        `${won(I.fineStep)}을 더 벌어 ${manwon(I.eligibilityThreshold)}이 되면 이 계산기는 간이과세 열에 "적용 불가"를 띄우고 일반과세 ${won(F.ceilGeneral)}만 남습니다. 매출 ${won(I.fineStep)} 차이가 부가세 ${won(F.ceilJump)} 차이로 바뀌는 자리입니다. ` +
        `면제선 ${manwon(I.exemptThreshold)}의 절벽 ${won(F.atExemptSimplified)}보다 ${times(F.cliffRatio, 1)} 높은 절벽이며, 매입 비율을 ${pct(I.defaultPurchase)}에서 ${pct(F.flipRetail)}까지 올려야 비로소 사라집니다. ` +
        `두 경계 가운데 어느 쪽이 내 매출에 가까운지가 부가세 계획의 첫 질문입니다.`,
    },
    {
      h2: `${eun(`${label("realestate")}·${label("entertainment")}`)} 간이과세가 되면 세금이 0, 세금이 생기면 간이과세가 안 된다 — 두 문턱이 ${manwon(I.specialThreshold)}에서 겹친다`,
      body:
        `두 업종의 간이과세 적용 상한은 ${manwon(I.specialThreshold)}으로, 납부 면제선 ${manwon(I.exemptThreshold)}과 같은 금액입니다. ` +
        `그래서 ${manwon(F.specialUnder)}에서는 간이과세가 가능하지만 부가세가 ${won(F.reUnderSimplified)}이고, ${manwon(I.specialThreshold)}에서는 부가가치율 ${pct(I.rateRealestate)}로 계산한 ${won(F.reAtSimplified)}이 나오지만 이미 적용 불가입니다. ` +
        `즉 이 두 업종에서 "간이과세로 부가세를 얼마 낸다"는 상태는 이 계산기의 어느 매출에서도 존재하지 않고, 간이과세의 의미는 오직 면제 여부 하나입니다. ` +
        `기본값 매출 ${manwon(I.defaultRevenue)}에서 두 업종의 간이과세 열이 비어 있는 것은 오류가 아니라 이 구조 때문입니다.`,
    },
    {
      h2: `업종을 여섯 번 바꿔도 일반과세는 ${won(F.genSame)}으로 같고, 간이과세만 ${won(F.simpMin)}~${won(F.simpMax)}으로 갈린다`,
      body:
        `매출 ${manwon(I.defaultRevenue)}·매입 ${pct(I.defaultPurchase)}에서 업종 선택을 ${F.industryCount}개 전부 돌리면 일반과세 부가세는 어느 업종이든 ${won(F.genSame)}으로 편차가 ${won(F.genSpread)}입니다. ` +
        `간이과세는 ${label("retail")}·${label("food")} ${won(F.simpMin)}에서 ${label("realestate")}·${label("entertainment")} ${won(F.simpMax)}까지 ${times(F.simpMax, F.simpMin)}로 벌어집니다. ` +
        `일반과세는 매출과 매입만 보고 업종을 보지 않기 때문에 업종 드롭다운은 오른쪽 열에만 작용하고, 왼쪽 열을 바꾸는 유일한 손잡이는 매입 비율입니다. ` +
        `따라서 업종 판정이 애매한 사업자에게 업종 선택의 세금 차이는 일반과세에서는 0원, 간이과세에서만 최대 ${won(F.simpSpread)}입니다.`,
    },
    {
      h2: `매입 비율 10%p마다 일반과세 부가세가 ${won(F.ladderHalfStep)}씩 줄어든다 — 매출의 ${pct(F.ladderHalfShare)}`,
      body:
        `${label("food")} 매출 ${manwon(I.defaultRevenue)}에서 매입 비율을 ${pct(I.purchaseZero)}·${pct(0.2)}·${pct(0.4)}·${pct(0.6)}·${pct(0.8)}로 옮기면 일반과세 부가세는 ${won(F.ladder0)}·${won(F.ladder20)}·${won(F.ladder40)}·${won(F.ladder60)}·${won(F.ladder80)}으로 ${pp(0.2)}마다 ${won(F.ladderStep)}씩, 즉 매출의 ${pct(F.ladderStepShare)}씩 줄어듭니다. ` +
        `같은 구간에서 간이과세는 ${won(F.foodSimplified)}으로 한 번도 움직이지 않습니다. ` +
        `그래서 매입 세금계산서 한 장의 가치는 일반과세자에게만 있고, 그 가치는 공급가액의 정확히 10%입니다. 간이과세자에게 매입 증빙은 부가세 계산에서는 0원이고 소득세 경비로만 의미가 있습니다. ` +
        `매입이 ${pct(I.purchaseHigh)}인 상태에서도 일반과세 ${won(F.ladder80)}은 간이과세 ${won(F.foodSimplified)}보다 크므로, 매입이 많다는 이유만으로 일반과세를 고르면 이 업종에서는 손해입니다.`,
    },
    {
      h2: `간이과세 상한 바로 아래에서 낼 수 있는 가장 큰 간이 부가세는 ${label("service")} ${won(F.serviceCeilSimplified)}, 매입이 0인 일반과세는 ${won(F.zeroCeilGeneral)}`,
      body:
        `간이과세가 허용되는 가장 큰 매출 ${manwon(F.ceilUnder)}에서 부가가치율이 가장 높은 일반 업종인 ${label("service")}(${pct(I.rateService)})의 간이 부가세는 ${won(F.serviceCeilSimplified)}입니다. ` +
        `같은 매출에서 매입 세금계산서가 하나도 없는 일반과세자의 부가세는 ${won(F.zeroCeilGeneral)}으로 ${times(F.zeroCeilGeneral, F.serviceCeilSimplified)}입니다. ` +
        `${label("food")}은 같은 매출에서 ${won(F.underCeilSimplified)}이라 격차가 더 큽니다. 간이과세의 상한선은 매출 기준 하나뿐이고 세액 상한은 따로 없지만, 어느 업종이든 상한 매출에서의 세액이 매입 0인 일반과세의 ${pct(I.rateService)} 아래에 머뭅니다. ` +
        `간이과세를 잃는 시점의 손실을 미리 재려면 이 두 숫자의 차이 ${won(F.ceilLoss)}이 상한이고, 매입이 있으면 그만큼 줄어듭니다.`,
    },
  ],
};
