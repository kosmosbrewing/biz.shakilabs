// /delivery-fee 파생 다이제스트 — 계산기는 주문금액·건수 한 조합의 3사 수수료만 보여준다. 여기는
// calcDeliveryFees를 주문금액 5천~10만원(1천원 단위) 전 구간 돌려서만 보이는 것을 적는다:
// 순위가 한 번도 바뀌지 않는 이유, 실질 수수료율이 주문금액에 따라 내려가는 속도, 중개수수료와
// 배달대행료가 같아지는 주문금액, 결제수수료 3.3%의 월 무게. 산문의 숫자는 F·I에서만 온다.

import { DELIVERY_APPS } from "../bizConstants";
import { calcDeliveryFees } from "@/utils/bizDeliveryCalc";
import { type Digest, manwon, num, pct, pp, won } from "./format";

const app = (key: string) => DELIVERY_APPS.find((a) => a.key === key)!;

export const DELIVERY_INPUTS = {
  defaultOrder: 20_000,
  defaultOrders: 500,
  presetLow: 15_000,
  presetMid: 25_000,
  presetHigh: 30_000,
  scanMin: 5_000,
  scanMax: 100_000,
  scanStep: 1_000,
  baeminCommission: app("baemin").commissionRate,
  baeminPayment: app("baemin").paymentFeeRate,
  baeminDelivery: app("baemin").avgDeliveryFee,
  coupangCommission: app("coupangeats").commissionRate,
  coupangDelivery: app("coupangeats").avgDeliveryFee,
  yogiyoCommission: app("yogiyo").commissionRate,
  yogiyoDelivery: app("yogiyo").avgDeliveryFee,
};
const I = DELIVERY_INPUTS;
const name = (key: string) => app(key).name;
const at = (order: number, orders = I.defaultOrders) => {
  const rs = calcDeliveryFees(order, orders);
  return Object.fromEntries(rs.map((r) => [r.appKey, r]));
};

/** 주문금액 전 구간에서 총수수료 순위가 바뀌는 횟수 */
export function rankChanges(): { changes: number; points: number; order: string[] } {
  let prev = "";
  let changes = 0;
  let points = 0;
  let order: string[] = [];
  for (let a = I.scanMin; a <= I.scanMax; a += I.scanStep) {
    points += 1;
    order = calcDeliveryFees(a, 1).slice().sort((x, y) => x.totalFee - y.totalFee).map((r) => r.appKey);
    const key = order.join("<");
    if (prev && key !== prev) changes += 1;
    prev = key;
  }
  return { changes, points, order };
}

/** 중개(+결제) 수수료가 배달대행료와 같아지는 주문금액 (1천원 단위, 처음 넘는 지점) */
export function commissionMeetsDelivery(key: string): number {
  for (let a = I.scanMin; a <= I.scanMax; a += I.scanStep) {
    const r = at(a, 1)[key];
    if (r.commission + r.paymentFee >= r.deliveryFee) return a;
  }
  return Number.NaN;
}

function facts() {
  const d = at(I.defaultOrder);
  const low = at(I.presetLow);
  const high = at(I.presetHigh);
  const rank = rankChanges();
  const b = d.baemin;
  const c = d.coupangeats;
  const y = d.yogiyo;
  return {
    rankChanges: rank.changes, rankPoints: rank.points,
    gapLow: low.baemin.totalFee - low.coupangeats.totalFee, gapHigh: high.baemin.totalFee - high.coupangeats.totalFee,
    yGapLow: low.yogiyo.totalFee - low.coupangeats.totalFee, yGapHigh: high.yogiyo.totalFee - high.coupangeats.totalFee,
    perOrderGap: (b.totalFee - c.totalFee) / I.defaultOrders, perOrderYGap: (y.totalFee - c.totalFee) / I.defaultOrders,
    coupangRateLow: low.coupangeats.feeRate, coupangRateHigh: high.coupangeats.feeRate, baeminRateLow: low.baemin.feeRate, baeminRateHigh: high.baemin.feeRate,
    coupangRateDefault: c.feeRate, baeminRateDefault: b.feeRate, yogiyoRateDefault: y.feeRate,
    rateDrop: low.coupangeats.feeRate - high.coupangeats.feeRate,
    deliveryShareLow: low.coupangeats.deliveryFee / low.coupangeats.totalFee, deliveryShareHigh: high.coupangeats.deliveryFee / high.coupangeats.totalFee,
    deliveryShareDefault: c.deliveryFee / c.totalFee,
    meetCoupang: commissionMeetsDelivery("coupangeats"), meetBaemin: commissionMeetsDelivery("baemin"), meetYogiyo: commissionMeetsDelivery("yogiyo"),
    revenue: I.defaultOrder * I.defaultOrders,
    baeminFee: b.totalFee, coupangFee: c.totalFee, yogiyoFee: y.totalFee, baeminNet: b.netRevenue, coupangNet: c.netRevenue, yogiyoNet: y.netRevenue,
    monthlyGap: b.totalFee - c.totalFee, yearlyGap: (b.totalFee - c.totalFee) * 12,
    baeminPaymentMonthly: b.paymentFee, paymentAsDeliveries: b.paymentFee / I.baeminDelivery,
    baeminCommissionMonthly: b.commission, baeminDeliveryMonthly: b.deliveryFee,
    netPerOrderCoupang: c.netRevenue / I.defaultOrders, netPerOrderYogiyo: y.netRevenue / I.defaultOrders, netPerOrderBaemin: b.netRevenue / I.defaultOrders,
    netShareCoupang: c.netRevenue / (I.defaultOrder * I.defaultOrders), netShareBaemin: b.netRevenue / (I.defaultOrder * I.defaultOrders),
    rateGapLow: low.baemin.feeRate - low.coupangeats.feeRate, rateGapHigh: high.baemin.feeRate - high.coupangeats.feeRate,
    yogiyoCommissionGap: I.yogiyoCommission - I.coupangCommission, yogiyoDeliveryGap: I.yogiyoDelivery - I.coupangDelivery,
    yogiyoMonthlyGap: y.totalFee - c.totalFee, yogiyoCommissionMonthly: y.commission, coupangCommissionMonthly: c.commission,
    baeminAllIn: I.baeminCommission + I.baeminPayment, baeminDeliveryGap: I.baeminDelivery - I.coupangDelivery,
    feePerOrderCoupang: I.defaultOrder - c.netRevenue / I.defaultOrders, feePerOrderBaemin: I.defaultOrder - b.netRevenue / I.defaultOrders,
    yogiyoCommissionPerOrder: I.defaultOrder * (I.yogiyoCommission - I.coupangCommission), yogiyoCommissionMonthlyGap: y.commission - c.commission,
    feeShareCoupang: 1 - c.netRevenue / (I.defaultOrder * I.defaultOrders), feeShareBaemin: 1 - b.netRevenue / (I.defaultOrder * I.defaultOrders),
  };
}
const F = facts();
const ORDER = rankChanges().order;

export const DELIVERY_DIGEST: Digest = {
  facts: F,
  inputs: I,
  findings: [
    {
      h2: `주문금액을 ${won(I.scanMin)}부터 ${manwon(I.scanMax)}까지 ${F.rankPoints}번 바꿔도 ${name(ORDER[0])} < ${name(ORDER[1])} < ${name(ORDER[2])} 순위는 한 번도 안 바뀐다`,
      body:
        `주문금액을 ${won(I.scanStep)} 단위로 ${F.rankPoints}개 지점에서 3사 총수수료를 계산해 순위를 매기면 순위 변동이 ${F.rankChanges}번입니다. ` +
        `${name("baemin")}은 ${name("coupangeats")}와 중개수수료율이 ${pct(I.baeminCommission, 1)}로 같은데 결제수수료 ${pct(I.baeminPayment, 1)}와 배달대행료 ${won(F.baeminDeliveryGap)}이 더 붙어 주문금액이 얼마든 앞설 수 없고, ` +
        `${name("yogiyo")}는 중개수수료율이 ${pp(F.yogiyoCommissionGap, 1)} 높고 배달대행료도 ${won(F.yogiyoDeliveryGap)} 높아 역시 어느 금액에서도 ${name("coupangeats")} 아래로 내려오지 않습니다. ` +
        `두 격차는 주문금액에 비례하는 항과 고정 항이 전부 같은 방향이라 교차점이 없습니다. 이 비교표에서 앱 선택의 근거는 요율표가 아니라 주문량·노출 같은 표 밖의 것이어야 합니다.`,
    },
    {
      h2: `${name("coupangeats")} 실질 수수료율은 주문 ${manwon(I.presetLow, 1)}에서 ${pct(F.coupangRateLow, 1)}, ${manwon(I.presetHigh)}에서 ${pct(F.coupangRateHigh, 1)} — 주문금액이 두 배면 요율이 ${pp(F.rateDrop, 1)} 내려간다`,
      body:
        `요율표의 중개수수료 ${pct(I.coupangCommission, 1)}는 고정이지만 배달대행료 ${won(I.coupangDelivery)}은 주문금액과 무관한 정액이라, 매출 대비 실질 수수료율은 주문금액이 클수록 내려갑니다. ` +
        `${name("coupangeats")}는 ${manwon(I.presetLow, 1)} 주문에서 ${pct(F.coupangRateLow, 1)}, 기본값 ${manwon(I.defaultOrder)}에서 ${pct(F.coupangRateDefault, 1)}, ${manwon(I.presetHigh)}에서 ${pct(F.coupangRateHigh, 1)}입니다. ${name("baemin")}은 같은 구간에서 ${pct(F.baeminRateLow, 1)}에서 ${pct(F.baeminRateHigh, 1)}로 내려갑니다. ` +
        `배달대행료가 총수수료에서 차지하는 비중은 ${name("coupangeats")} 기준 ${manwon(I.presetLow, 1)}에서 ${pct(F.deliveryShareLow, 1)}, ${manwon(I.presetHigh)}에서 ${pct(F.deliveryShareHigh, 1)}입니다. ` +
        `객단가를 올리는 것은 이 표에서 요율을 깎는 유일한 방법이고, 그 효과는 요율 인하 협상보다 크게 나타납니다.`,
    },
    {
      h2: `중개수수료가 배달대행료를 넘어서는 주문금액은 ${name("coupangeats")} ${won(F.meetCoupang)}, ${name("baemin")} ${won(F.meetBaemin)}`,
      body:
        `주문 한 건에서 비율로 붙는 수수료(중개+결제)와 정액 배달대행료가 같아지는 지점을 ${won(I.scanStep)} 단위로 찾으면 ${name("coupangeats")}는 ${won(F.meetCoupang)}, ${name("yogiyo")}는 ${won(F.meetYogiyo)}, ${name("baemin")}은 결제수수료까지 합친 ${pct(F.baeminAllIn, 1)} 기준 ${won(F.meetBaemin)}입니다. ` +
        `기본값 ${manwon(I.defaultOrder)} 주문은 세 앱 모두 이 지점 아래에 있어, 사장이 내는 수수료의 절반 이상이 배달대행료입니다(${name("coupangeats")} ${pct(F.deliveryShareDefault, 1)}). ` +
        `요율 인하 논의가 중개수수료에 집중되지만 이 계산기의 주문금액대에서는 정액 배달대행료가 더 큰 항목이며, ${won(F.meetCoupang)} 이상의 고단가 주문에서만 요율이 주된 변수가 됩니다. ` +
        `묶음 주문이나 최소 주문금액 상향이 요율 협상보다 먼저 오는 이유가 이 교차점입니다.`,
    },
    {
      h2: `월 ${num(I.defaultOrders)}건 × ${manwon(I.defaultOrder)}의 매출 ${manwon(F.revenue)}에서 ${name("baemin")}과 ${name("coupangeats")}의 수수료 차이는 월 ${won(F.monthlyGap)}, 연 ${manwon(F.yearlyGap)}`,
      body:
        `기본값에서 월 총수수료는 ${name("coupangeats")} ${won(F.coupangFee)}, ${name("yogiyo")} ${won(F.yogiyoFee)}, ${name("baemin")} ${won(F.baeminFee)}이고 월 순수익은 각각 ${won(F.coupangNet)}·${won(F.yogiyoNet)}·${won(F.baeminNet)}입니다. ` +
        `가장 싼 앱과 가장 비싼 앱의 차이는 월 ${won(F.monthlyGap)}, 열두 달이면 ${won(F.yearlyGap)}으로, 주문 한 건당 ${won(F.perOrderGap)}씩 쌓인 결과입니다. ` +
        `${name("yogiyo")}와 ${name("coupangeats")}의 차이는 건당 ${won(F.perOrderYGap)}, 월 ${won(F.yogiyoMonthlyGap)}으로 훨씬 작습니다. ` +
        `한 앱에만 입점할 수 없는 매장이 대부분이므로 이 차이는 "어느 앱을 고르나"보다 "어느 앱의 주문 비중을 키우나"의 값이며, 주문 ${num(I.defaultOrders)}건을 어느 쪽으로 몰아도 매출 ${manwon(F.revenue)}은 같습니다.`,
    },
    {
      h2: `${name("baemin")}의 결제수수료 ${pct(I.baeminPayment, 1)}는 월 ${won(F.baeminPaymentMonthly)} — 배달대행료 ${num(F.paymentAsDeliveries, 0)}건어치`,
      body:
        `3사 가운데 결제수수료를 따로 떼는 곳은 ${name("baemin")}뿐이고, 기본값에서 그 금액은 월 ${won(F.baeminPaymentMonthly)}입니다. 같은 매장의 중개수수료 ${won(F.baeminCommissionMonthly)}, 배달대행료 ${won(F.baeminDeliveryMonthly)}과 나란히 놓으면 세 항목 중 가장 작지만, ` +
        `배달대행료 ${won(I.baeminDelivery)}으로 환산하면 ${num(F.paymentAsDeliveries, 0)}건분이고 ${name("coupangeats")}와의 월 격차 ${won(F.monthlyGap)}의 대부분을 차지합니다. ` +
        `${name("coupangeats")}·${name("yogiyo")}는 결제수수료가 중개수수료에 포함돼 "없음"으로 표시되므로 요율표의 중개수수료 숫자만 비교하면 ${name("baemin")}과 ${name("coupangeats")}가 같아 보이지만, 실제 부담은 ${pp(I.baeminPayment, 1)}가 다릅니다. ` +
        `요율을 비교할 때는 항목 수가 다른 표를 합계로 바꿔 읽어야 하고, 이 계산기의 "월 총 수수료"가 그 합계입니다.`,
    },
    {
      h2: `${manwon(I.defaultOrder)} 주문에서 사장 손에 남는 돈은 ${name("coupangeats")} ${won(F.netPerOrderCoupang)}, ${name("yogiyo")} ${won(F.netPerOrderYogiyo)}, ${name("baemin")} ${won(F.netPerOrderBaemin)}`,
      body:
        `기본값 주문 한 건 ${manwon(I.defaultOrder)}에서 수수료를 뺀 순수익은 ${name("coupangeats")} ${won(F.netPerOrderCoupang)}(${pct(F.netShareCoupang, 1)}), ${name("yogiyo")} ${won(F.netPerOrderYogiyo)}, ${name("baemin")} ${won(F.netPerOrderBaemin)}(${pct(F.netShareBaemin, 1)})입니다. ` +
        `여기서 재료비·인건비·임대료는 아직 빠지지 않았으므로, 손익분기점 계산기의 변동비율에 이 수수료율 ${pct(F.coupangRateDefault, 1)}~${pct(F.baeminRateDefault, 1)}를 더해야 배달 매장의 실제 손익분기점이 나옵니다. ` +
        `홀 매출과 같은 메뉴 가격을 쓰는 매장이라면 배달 주문 한 건은 홀 주문보다 ${won(F.feePerOrderCoupang)}~${won(F.feePerOrderBaemin)} 적게 남고, 그 차이를 메우는 배달 전용 가격을 정하려면 이 표의 순수익 열에서 출발해야 합니다. ` +
        `"매출이 늘었는데 남는 게 없다"는 배달 매장의 흔한 진단은 이 ${pct(F.feeShareCoupang, 1)}~${pct(F.feeShareBaemin, 1)}가 매출에 먼저 붙어 있기 때문입니다.`,
    },
    {
      h2: `${name("baemin")}과 ${name("coupangeats")}의 실질 수수료율 격차는 ${manwon(I.presetLow, 1)}에서 ${pp(F.rateGapLow, 2)}, ${manwon(I.presetHigh)}에서 ${pp(F.rateGapHigh, 2)} — 고단가일수록 좁혀진다`,
      body:
        `두 앱의 건당 수수료 차이는 결제수수료 ${pct(I.baeminPayment, 1)}(비례)와 배달대행료 차 ${won(F.baeminDeliveryGap)}(정액)의 합입니다. 주문금액이 커지면 정액 부분의 비중이 줄어 실질 수수료율 격차는 ${manwon(I.presetLow, 1)}에서 ${pp(F.rateGapLow, 2)}, ${manwon(I.presetHigh)}에서 ${pp(F.rateGapHigh, 2)}로 좁혀집니다. ` +
        `월 ${num(I.defaultOrders)}건 기준 총수수료 차이는 ${manwon(I.presetLow, 1)}에서 ${won(F.gapLow)}, ${manwon(I.presetHigh)}에서 ${won(F.gapHigh)}으로 금액은 오히려 커집니다 — 비례 항이 자라기 때문입니다. ` +
        `즉 저단가 매장은 비율로, 고단가 매장은 금액으로 격차를 체감하며, 어느 쪽이든 ${name("coupangeats")}가 낮다는 결론은 같습니다. ` +
        `${name("yogiyo")}와 ${name("coupangeats")}의 격차는 같은 구간에서 ${won(F.yGapLow)}에서 ${won(F.yGapHigh)}으로, ${name("baemin")} 격차의 절반이 안 됩니다.`,
    },
    {
      h2: `${name("yogiyo")}의 중개수수료율은 ${name("coupangeats")}보다 ${pp(F.yogiyoCommissionGap, 1)} 높지만 월 차이는 ${won(F.yogiyoMonthlyGap)} — 배달대행료 ${won(F.yogiyoDeliveryGap)} 차이가 그 안에 있다`,
      body:
        `기본값에서 ${name("yogiyo")} 중개수수료는 월 ${won(F.yogiyoCommissionMonthly)}, ${name("coupangeats")}는 ${won(F.coupangCommissionMonthly)}으로 요율 ${pp(F.yogiyoCommissionGap, 1)} 차이가 월 ${won(F.yogiyoCommissionMonthlyGap)}을 만듭니다. ` +
        `여기에 배달대행료 평균 차이 ${won(F.yogiyoDeliveryGap)} × ${num(I.defaultOrders)}건이 더해져 월 총수수료 차이는 ${won(F.yogiyoMonthlyGap)}입니다. ` +
        `요율 ${pp(F.yogiyoCommissionGap, 1)}는 눈에 띄지만 ${manwon(I.defaultOrder)} 주문에서는 건당 ${won(F.yogiyoCommissionPerOrder)}이고, 배달대행료 ${won(F.yogiyoDeliveryGap)}과 합쳐야 건당 ${won(F.perOrderYGap)}이 됩니다. ` +
        `이 계산기의 배달대행료는 앱별 평균값 가정이므로, 실제 계약 대행료가 앱과 무관하게 같다면 ${name("yogiyo")}와 ${name("coupangeats")}의 차이는 요율 ${pp(F.yogiyoCommissionGap, 1)} 하나로 줄어듭니다.`,
    },
  ],
};
