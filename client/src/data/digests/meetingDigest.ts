// /meeting-cost 파생 다이제스트 — 계산기는 인원·1인 비용·빈도 한 조합의 예산만 보여준다. 여기는
// calculateMeetingCost를 기본값 주변으로 돌려서만 보이는 것을 적는다: 매입세액이 10%가 아니라 11분의 1인
// 이유와 그 차액, 1인 비용 1만원과 인원 2명이 같은 값이 되는 대칭, 연 예산을 최저임금 월급으로 환산한
// 크기(인건비 데이터와 교차), 부가세 토글 하나의 무게. 산문의 숫자는 F·I에서만 온다.

import { MINIMUM_MONTHLY_WAGE_2026, MINIMUM_WAGE_2026 } from "../laborCost";
import { calculateMeetingCost } from "@/utils/bizExpansionCalc";
import { type Digest, num, pct, won } from "./format";

export const MEETING_INPUTS = {
  attendees: 6,
  costPerPerson: 30_000,
  meetingsPerMonth: 4,
  months: 12,
  altCost: 20_000,
  altAttendees: 4,
  altMeetings: 2,
  altMonths: 6,
  plusOne: 7,
  vatRate: 0.1,
  minimumMonthly: MINIMUM_MONTHLY_WAGE_2026,
  minimumHourly: MINIMUM_WAGE_2026,
  costCut: 10_000,
};
const I = MEETING_INPUTS;
const run = (over: Partial<{ attendees: number; costPerPerson: number; meetingsPerMonth: number; months: number; vatIncluded: boolean }> = {}) => {
  const r = calculateMeetingCost({ attendees: I.attendees, costPerPerson: I.costPerPerson, meetingsPerMonth: I.meetingsPerMonth, months: I.months, vatIncluded: true, ...over });
  if (!r.success) throw new Error("meeting cost failed");
  return r.data;
};

function facts() {
  const d = run();
  const cheaper = run({ costPerPerson: I.altCost });
  const fewer = run({ attendees: I.altAttendees });
  const biweekly = run({ meetingsPerMonth: I.altMeetings });
  const half = run({ months: I.altMonths });
  const noVat = run({ vatIncluded: false });
  const plus = run({ attendees: I.plusOne });
  const naive = d.annualBudget * I.vatRate;
  return {
    perMeeting: d.perMeeting, monthly: d.monthlyBudget, annual: d.annualBudget, vat: d.vatCredit, perPerson: d.annualPerPerson,
    naiveVat: naive, vatGap: naive - d.vatCredit, vatShare: d.vatCredit / d.annualBudget, supply: d.annualBudget - d.vatCredit,
    cheaperAnnual: cheaper.annualBudget, fewerAnnual: fewer.annualBudget, cheaperPerPerson: cheaper.annualPerPerson, fewerPerPerson: fewer.annualPerPerson,
    altSaving: d.annualBudget - cheaper.annualBudget, altSavingShare: 1 - cheaper.annualBudget / d.annualBudget,
    biweeklyAnnual: biweekly.annualBudget, halfAnnual: half.annualBudget, biweeklyVat: biweekly.vatCredit,
    noVatCredit: noVat.vatCredit, noVatAnnual: noVat.annualBudget,
    minWageMonths: d.annualBudget / I.minimumMonthly, minWageHours: d.annualPerPerson / I.minimumHourly,
    perPersonMonthly: d.annualPerPerson / I.months,
    plusAnnual: plus.annualBudget, plusGap: plus.annualBudget - d.annualBudget, plusPct: plus.annualBudget / d.annualBudget - 1, plusPerPerson: plus.annualPerPerson,
    vatPerMeeting: d.vatCredit / (I.meetingsPerMonth * I.months), vatPerHead: d.vatCredit / (I.meetingsPerMonth * I.months) / I.attendees,
    monthlyVat: d.vatCredit / I.months, plusMonthly: (plus.annualBudget - d.annualBudget) / I.months,
  };
}
const F = facts();

export const MEETING_DIGEST: Digest = {
  facts: F,
  inputs: I,
  findings: [
    {
      h2: `연 예산 ${won(F.annual)}의 매입세액은 ${won(F.vat)} — ${pct(I.vatRate, 0)}인 ${won(F.naiveVat)}이 아니라 11분의 1`,
      body:
        `기본값(${I.attendees}명·1인 ${won(I.costPerPerson)}·월 ${I.meetingsPerMonth}회·${I.months}개월)의 연 예산은 ${won(F.annual)}이고 계산기가 표시하는 매입세액 공제 가능액은 ${won(F.vat)}입니다. ` +
        `예산에 ${pct(I.vatRate, 0)}를 곱한 ${won(F.naiveVat)}보다 ${won(F.vatGap)} 작은데, 결제 금액이 부가세를 포함한 값이라 공급가액은 ${won(F.supply)}이고 세액은 그 ${pct(I.vatRate, 0)}, 즉 결제액의 ${pct(F.vatShare, 2)}이기 때문입니다. ` +
        `영수증 금액에 ${pct(I.vatRate, 0)}를 곱해 환급을 어림하면 연 ${won(F.vatGap)}을 과대 계산하게 되고, 이 차이는 예산이 커질수록 같은 비율로 커집니다. ` +
        `회의 한 번의 매입세액은 ${won(F.vatPerMeeting)}, 참석자 한 명분은 ${won(F.vatPerHead)}으로, 세금계산서 한 장이 돌려주는 돈의 크기가 이 정도입니다.`,
    },
    {
      h2: `1인 비용을 ${won(I.costPerPerson)}에서 ${won(I.altCost)}으로 내리는 것과 인원을 ${I.attendees}명에서 ${I.altAttendees}명으로 줄이는 것은 연 예산 ${won(F.cheaperAnnual)}으로 같다`,
      body:
        `1인 비용을 ${won(I.altCost)}으로 낮추면 연 예산은 ${won(F.cheaperAnnual)}, 인원을 ${I.altAttendees}명으로 줄여도 ${won(F.fewerAnnual)}으로 같습니다. 둘 다 기본값 ${won(F.annual)}에서 ${won(F.altSaving)}(${pct(F.altSavingShare, 1)})을 줄입니다. ` +
        `그러나 1인당 연간 비용은 다릅니다 — 비용을 낮춘 쪽은 ${won(F.cheaperPerPerson)}, 인원을 줄인 쪽은 ${won(F.fewerPerPerson)}으로 기본값과 같습니다. ` +
        `같은 예산 절감이라도 앞쪽은 "회의의 질"을, 뒤쪽은 "참석자"를 바꾸는 결정이고, 계산기의 1인당 연간 비용 열은 그 둘을 구분하는 유일한 숫자입니다. ` +
        `참석자를 한 명 늘려 ${I.plusOne}명이 되면 연 예산은 ${won(F.plusAnnual)}으로 ${won(F.plusGap)}(${pct(F.plusPct, 1)}) 늘고 1인당 비용은 ${won(F.plusPerPerson)}으로 그대로입니다.`,
    },
    {
      h2: `월 ${I.meetingsPerMonth}회를 월 ${I.altMeetings}회로 줄이면 ${won(F.annual)}이 ${won(F.biweeklyAnnual)} — ${I.months}개월을 ${I.altMonths}개월로 줄인 것과 같은 값`,
      body:
        `월 회의 횟수를 ${I.meetingsPerMonth}회에서 ${I.altMeetings}회로 줄이면 연 예산은 ${won(F.biweeklyAnnual)}이고, 횟수는 그대로 두고 기간을 ${I.altMonths}개월로 줄여도 ${won(F.halfAnnual)}으로 같습니다. ` +
        `계산기의 네 입력(인원·1인 비용·월 횟수·개월)은 모두 곱으로만 들어가므로 어느 하나를 절반으로 만들면 결과도 정확히 절반이고, 매입세액도 ${won(F.biweeklyVat)}으로 절반이 됩니다. ` +
        `즉 "회의를 줄인다"는 결정은 어느 손잡이를 돌려도 예산에는 같은 값이며, 다른 것은 회의 한 번의 비용 ${won(F.perMeeting)}이 그대로인지(횟수·기간)와 바뀌는지(인원·1인 비용)입니다. ` +
        `한 번의 회의 비용을 줄이지 않고 횟수만 줄이면 회의당 비용은 여전히 ${won(F.perMeeting)}, 월 예산만 ${won(F.monthly)}에서 절반이 됩니다.`,
    },
    {
      h2: `연 회의 예산 ${won(F.annual)}은 최저임금 직원 ${num(F.minWageMonths, 1)}개월분 월급과 같다`,
      body:
        `기본값의 연 예산 ${won(F.annual)}을 인건비 계산기의 최저임금 월급 ${won(I.minimumMonthly)}으로 나누면 ${num(F.minWageMonths, 1)}개월입니다. 여섯 명이 일주일에 한 번 ${won(I.costPerPerson)}씩 쓰는 회의가 최저임금 직원 한 명의 넉 달치 급여와 맞먹습니다. ` +
        `참석자 한 명의 연간 비용 ${won(F.perPerson)}은 최저시급 ${won(I.minimumHourly)}으로 ${num(F.minWageHours, 1)}시간, 월로는 ${won(F.perPersonMonthly)}입니다. ` +
        `회의 비용은 식대·장소비만 계산하고 참석자의 시간은 넣지 않으므로, 여기에 참석자 ${I.attendees}명의 급여 시간을 더하면 실제 회의 비용은 이 표보다 훨씬 큽니다. ` +
        `이 계산기가 보여주는 것은 회의의 현금 비용이고, 시간 비용은 인건비 계산기의 월급을 근무 시간으로 나눈 값에 회의 시간을 곱해 따로 얹어야 합니다.`,
    },
    {
      h2: `부가세 토글을 끄면 매입세액 ${won(F.vat)}이 ${won(F.noVatCredit)}이 된다 — 연 예산의 ${pct(F.vatShare, 2)}가 영수증 종류 하나에 달려 있다`,
      body:
        `같은 ${won(F.noVatAnnual)}을 쓰더라도 세금계산서나 신용카드 매출전표를 받으면 ${won(F.vat)}을 매입세액으로 공제받고, 간이영수증만 받으면 공제가 ${won(F.noVatCredit)}입니다. 토글 하나가 연 ${won(F.vat)}, 예산의 ${pct(F.vatShare, 2)}를 바꿉니다. ` +
        `월로 나누면 ${won(F.monthlyVat)}, 회의 한 번이면 ${won(F.vatPerMeeting)}입니다. 간이과세자 식당에서 결제하면 세금계산서를 받아도 공제가 제한되므로 실제 공제액은 이 값과 ${won(F.noVatCredit)} 사이 어딘가입니다. ` +
        `부가세 비교 계산기에서 확인할 수 있듯 사업자 본인이 간이과세자라면 매입세액 공제가 아예 없으므로 이 토글은 일반과세자에게만 의미가 있습니다. ` +
        `회의비 지출의 증빙 규칙을 정하는 것이 이 페이지에서 가장 값비싼 결정이며, 그 값이 연 ${won(F.vat)}입니다.`,
    },
    {
      h2: `회의 한 번 ${won(F.perMeeting)}, 월 ${won(F.monthly)}, 연 ${won(F.annual)} — 세 숫자는 모두 ${I.attendees} × ${won(I.costPerPerson)}의 배수다`,
      body:
        `기본값에서 회의 한 번의 비용은 ${I.attendees}명 × ${won(I.costPerPerson)} = ${won(F.perMeeting)}이고, 월 예산은 그 ${I.meetingsPerMonth}배 ${won(F.monthly)}, 연 예산은 다시 ${I.months}배 ${won(F.annual)}입니다. ` +
        `1인당 연간 비용 ${won(F.perPerson)}은 연 예산을 인원으로 나눈 값이자 1인 비용 × 연간 회의 횟수(${I.meetingsPerMonth * I.months}회)이기도 합니다. ` +
        `회의비를 접대비가 아닌 회의비로 처리하려면 1인당 금액이 과도하지 않아야 하는데, 이 계산기의 1인당 열은 연간 합계이므로 한 끼 기준 ${won(I.costPerPerson)}과 연 ${won(F.perPerson)}을 구분해 읽어야 합니다. ` +
        `한도 판정은 회당 1인 금액에서, 예산 편성은 연 합계에서 출발하며 두 숫자를 잇는 것은 회의 횟수 ${I.meetingsPerMonth * I.months}회입니다.`,
    },
    {
      h2: `참석자 한 명이 늘면 연 ${won(F.plusGap)}, 월 ${won(F.plusMonthly)} — 1인 비용을 ${won(I.costCut)} 낮춘 절감액의 절반`,
      body:
        `기본값에 참석자 한 명을 더해 ${I.plusOne}명으로 만들면 연 예산은 ${won(F.plusAnnual)}으로 ${won(F.plusGap)} 늘어납니다. 이 증가분은 1인당 연간 비용 ${won(F.perPerson)}과 정확히 같습니다 — 새 참석자 한 명의 연간 비용이기 때문입니다. ` +
        `반대로 1인 비용을 ${won(I.altCost)}으로 낮추면 연 ${won(F.altSaving)}이 줄어드는데, 이는 참석자 두 명분과 같은 크기입니다. ` +
        `즉 회의 규모를 정할 때 "한 명 더"는 ${won(F.plusGap)}짜리 결정이고, 메뉴를 한 단계 낮추는 것은 두 명을 빼는 것과 같은 결정입니다. ` +
        `인원을 늘리는 결정은 연 예산을 계단처럼 올리고 메뉴 단가는 기울기를 바꾸므로, 참석자 명단을 정하는 회의와 장소를 정하는 회의는 예산에서 다른 종류의 결정입니다.`,
    },
    {
      h2: `연 ${won(F.annual)} 가운데 공급가액은 ${won(F.supply)}, 부가세는 ${won(F.vat)} — 경비로 잡히는 돈과 환급되는 돈의 경계`,
      body:
        `일반과세자에게 회의비 ${won(F.annual)}은 두 갈래로 나뉩니다. 공급가액 ${won(F.supply)}은 소득세·법인세 계산에서 경비로 빠지고, 부가세 ${won(F.vat)}은 부가세 신고에서 매입세액으로 돌아옵니다. ` +
        `경비 ${won(F.supply)}의 절세 효과는 세율에 따라 달라 종합소득세율 24% 구간이면 그 24%가 절세지만, 매입세액 ${won(F.vat)}은 세율과 무관하게 전액 공제입니다. ` +
        `그래서 같은 영수증에서 세율이 낮은 사업자에게는 부가세 쪽이, 세율이 높은 사업자에게는 경비 쪽이 상대적으로 큰 몫이 됩니다. ` +
        `간이영수증으로 받으면 ${won(F.annual)} 전체가 경비로만 남고 매입세액 ${won(F.vat)}은 사라지므로, 증빙 종류는 두 갈래 가운데 한쪽을 통째로 닫는 선택입니다.`,
    },
  ],
};
