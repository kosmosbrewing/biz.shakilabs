// /labor-cost 파생 다이제스트 — 계산기는 월급 하나의 4대보험·인건비를 보여준다. 여기는
// calculateLaborCost를 최저임금~2천만원, 6개 업종, 퇴직급여 켜고 끄며 돌려서만 보이는 것을 적는다:
// 국민연금 상한이 걸리는 급여와 그 뒤 부담률의 하강, 건강보험이 국민연금을 추월하는 급여,
// 사업주·근로자 부담 차이의 정체. 요율 한 줄을 옮겨 적는 문장은 발견이 아니다.
// 산문의 숫자는 F(엔진 실행값)·I(입력값)에서만 온다.

import { SOCIAL_INSURANCE } from "../bizConstants";
import { INDUSTRY_ACCIDENT_RATES, LABOR_COST_SALARY_PRESETS, MINIMUM_MONTHLY_WAGE_2026 } from "../laborCost";
import { calculateLaborCost } from "@/utils/laborCostCalc";
import { type Digest, manwon, num, pct, pp, times, won } from "./format";

export const LABOR_INPUTS = {
  defaultSalary: 3_000_000,
  minimumWage: MINIMUM_MONTHLY_WAGE_2026,
  preset5: LABOR_COST_SALARY_PRESETS[4].value,
  pensionCap: SOCIAL_INSURANCE.nationalPension.upperLimit,
  salary10m: 10_000_000,
  salary20m: 20_000_000,
  scanStep: 10_000,
  employees: 10,
  officeRate: INDUSTRY_ACCIDENT_RATES[0].rate,
  constructionRate: INDUSTRY_ACCIDENT_RATES[3].rate,
  industries: INDUSTRY_ACCIDENT_RATES.length,
  monthlyHours: 209,
};
const I = LABOR_INPUTS;

const run = (monthlySalary: number, industryKey = "office", includeRetirement = true, employeeCount = 1) => {
  const r = calculateLaborCost({ monthlySalary, employeeCount, industryKey, includeRetirement });
  if (!r.success) throw new Error(`labor cost failed at ${monthlySalary}`);
  return r.data;
};

/** 사업주 건강보험+장기요양이 국민연금을 처음 넘어서는 급여 (1만원 단위) */
export function healthOvertakesPension(): number {
  for (let s = I.pensionCap; s <= I.salary20m; s += I.scanStep) {
    const e = run(s).employer;
    if (e.healthInsurance + e.longTermCare > e.nationalPension) return s;
  }
  return Number.NaN;
}

function facts() {
  const d = run(I.defaultSalary);
  const min = run(I.minimumWage);
  const cap = run(I.pensionCap);
  const s10 = run(I.salary10m);
  const s20 = run(I.salary20m);
  const cross = healthOvertakesPension();
  const atCross = run(cross);
  const construction = run(I.defaultSalary, "construction");
  const noRetire = run(I.defaultSalary, "office", false);
  const ten = run(I.defaultSalary, "office", true, I.employees);
  const employerAll = INDUSTRY_ACCIDENT_RATES.map((r) => run(I.defaultSalary, r.key).totalCostPerEmployee);
  return {
    total: d.totalCostPerEmployee, overhead: d.overheadRate, employerIns: d.employer.totalInsurance, employeeIns: d.employee.totalInsurance,
    insGap: d.employer.totalInsurance - d.employee.totalInsurance, accident: d.employer.industrialAccident,
    retirement: d.retirementReserve, retireVsIns: d.retirementReserve / d.employer.totalInsurance,
    noRetireOverhead: noRetire.overheadRate, overheadDrop: d.overheadRate - noRetire.overheadRate,
    minTotal: min.totalCostPerEmployee, minNet: min.employeeNetPay, minGap: min.totalCostPerEmployee - min.employeeNetPay,
    minGapShare: (min.totalCostPerEmployee - min.employeeNetPay) / min.employeeNetPay, minOverhead: min.overheadRate,
    capOverhead: cap.overheadRate, capPension: cap.employer.nationalPension,
    overhead10: s10.overheadRate, overhead20: s20.overheadRate, pension10: s10.employer.nationalPension, pension20: s20.employer.nationalPension,
    health10: s10.employer.healthInsurance + s10.employer.longTermCare, health20: s20.employer.healthInsurance + s20.employer.longTermCare,
    healthVsPension20: (s20.employer.healthInsurance + s20.employer.longTermCare) / s20.employer.nationalPension,
    cross, crossHealth: atCross.employer.healthInsurance + atCross.employer.longTermCare, crossPension: atCross.employer.nationalPension,
    constructionTotal: construction.totalCostPerEmployee, constructionOverhead: construction.overheadRate,
    constructionGap: construction.totalCostPerEmployee - d.totalCostPerEmployee,
    constructionGapYear: (construction.totalCostPerEmployee - d.totalCostPerEmployee) * 12,
    constructionAccident: construction.employer.industrialAccident,
    constructionGapYearTen: (construction.totalCostPerEmployee - d.totalCostPerEmployee) * 12 * I.employees,
    retirementYear: d.retirementReserve * 12, extraPerHead: d.totalCostPerEmployee - I.defaultSalary,
    extraHeads: (ten.totalAnnualCost - I.defaultSalary * I.employees * 12) / (d.totalCostPerEmployee * 12),
    costPerWon: 1 + min.overheadRate, netPerWon: min.employeeNetPay / I.minimumWage,
    employerShare20: s20.employer.totalInsurance / I.salary20m, accidentGap: I.constructionRate - I.officeRate,
    spread: Math.max(...employerAll) - Math.min(...employerAll),
    tenMonthly: ten.totalMonthlyCost, tenAnnual: ten.totalAnnualCost, tenSalaryAnnual: I.defaultSalary * I.employees * 12,
    tenExtra: ten.totalAnnualCost - I.defaultSalary * I.employees * 12,
    net: d.employeeNetPay, netShare: d.employeeNetPay / I.defaultSalary, net20: s20.employeeNetPay, net20Share: s20.employeeNetPay / I.salary20m,
    employeeShare: d.employee.totalInsurance / I.defaultSalary, employeeShare20: s20.employee.totalInsurance / I.salary20m,
    employerShare: d.employer.totalInsurance / I.defaultSalary,
    pensionEmployer: d.employer.nationalPension, healthEmployer: d.employer.healthInsurance + d.employer.longTermCare,
    healthShare: (d.employer.healthInsurance + d.employer.longTermCare) / I.defaultSalary,
    preset5Overhead: run(I.preset5).overheadRate,
  };
}
const F = facts();

export const LABOR_DIGEST: Digest = {
  facts: F,
  inputs: I,
  findings: [
    {
      h2: `사업주 추가 부담률은 최저임금부터 ${manwon(I.pensionCap)}까지 ${pct(F.overhead, 2)}로 고정이고, 그 위에서만 내려간다`,
      body:
        `사무직·퇴직급여 포함 기준으로 급여를 최저임금 ${won(I.minimumWage)}부터 올리며 급여 대비 사업주 추가 부담률을 재면 ${pct(F.minOverhead, 2)}, ${manwon(I.defaultSalary)}에서 ${pct(F.overhead, 2)}, ${manwon(I.preset5)}에서 ${pct(F.preset5Overhead, 2)}, ${manwon(I.pensionCap)}에서 ${pct(F.capOverhead, 2)}로 소수점 둘째 자리까지 같습니다. ` +
        `모든 항목이 급여에 비례하기 때문입니다. 국민연금 상한 ${manwon(I.pensionCap)}을 넘기면 비로소 비율이 떨어져 ${manwon(I.salary10m)}에서 ${pct(F.overhead10, 2)}, ${manwon(I.salary20m)}에서 ${pct(F.overhead20, 2)}가 됩니다. ` +
        `상한 위에서 사업주 국민연금은 ${won(F.capPension)}에 멈추므로 ${manwon(I.salary20m)} 급여의 국민연금도 ${won(F.pension20)}으로 ${manwon(I.pensionCap)}과 같습니다. ` +
        `"연봉이 높을수록 회사 부담 비율이 크다"는 말은 이 표에서 반대이며, 비율이 가장 무거운 구간은 상한 아래 전체입니다.`,
    },
    {
      h2: `급여 ${manwon(F.cross)}부터 사업주 건강보험이 국민연금보다 커진다 — ${manwon(I.salary20m)}에서는 ${times(F.health20, F.pension20)}`,
      body:
        `급여 ${manwon(I.defaultSalary)}에서 사업주 국민연금은 ${won(F.pensionEmployer)}, 건강보험과 장기요양의 합은 ${won(F.healthEmployer)}으로 국민연금이 큽니다. ` +
        `국민연금이 ${manwon(I.pensionCap)}에서 ${won(F.capPension)}에 멈춘 뒤에도 건강보험은 계속 자라, ${manwon(I.scanStep)} 단위로 훑으면 급여 ${won(F.cross)}에서 처음 건강보험·장기요양 ${won(F.crossHealth)}이 국민연금 ${won(F.crossPension)}을 넘어섭니다. ` +
        `${manwon(I.salary10m)}에서는 ${won(F.health10)} 대 ${won(F.pension10)}, ${manwon(I.salary20m)}에서는 ${won(F.health20)} 대 ${won(F.pension20)}으로 ${times(F.health20, F.pension20)}가 됩니다. ` +
        `고액 급여의 보험료 부담을 줄이려는 논의가 국민연금이 아니라 건강보험을 향해야 하는 이유가 이 교차점입니다.`,
    },
    {
      h2: `사업주 ${won(F.employerIns)}과 근로자 ${won(F.employeeIns)}의 차이 ${won(F.insGap)}은 정확히 산재보험 하나다`,
      body:
        `급여 ${manwon(I.defaultSalary)}·사무직에서 사업주가 내는 4대보험은 ${won(F.employerIns)}, 근로자 몫은 ${won(F.employeeIns)}입니다. ` +
        `차이 ${won(F.insGap)}은 사업주만 내는 산재보험 ${won(F.accident)}과 1원까지 같습니다. 국민연금·건강보험·장기요양·고용보험은 이 계산기에서 사업주와 근로자가 같은 요율을 나눠 내므로, 두 열의 차이를 만드는 항목은 산재 하나뿐입니다. ` +
        `그래서 업종 드롭다운은 사업주 열만 바꾸고 근로자 열은 ${I.industries}개 업종 어디서나 ${won(F.employeeIns)}으로 같습니다. 건설업으로 바꾸면 산재가 ${won(F.constructionAccident)}이 되어 차이도 그만큼 벌어집니다. ` +
        `근로자 실수령을 묻는 질문에 업종은 변수가 아니고, 사업주 인건비를 묻는 질문에만 변수입니다.`,
    },
    {
      h2: `같은 ${manwon(I.defaultSalary)} 급여의 사업주 인건비가 사무직 ${won(F.total)}에서 건설업 ${won(F.constructionTotal)}까지 — 월 ${won(F.constructionGap)}, 연 ${won(F.constructionGapYear)}`,
      body:
        `급여 ${manwon(I.defaultSalary)}·퇴직급여 포함으로 ${I.industries}개 업종을 전부 돌리면 1인 월 인건비는 사무직 ${won(F.total)}(부담률 ${pct(F.overhead, 2)})이 가장 낮고 건설업 ${won(F.constructionTotal)}(${pct(F.constructionOverhead, 2)})이 가장 높아 편차가 ${won(F.spread)}입니다. ` +
        `차이의 전부는 산재보험 요율 ${pct(I.officeRate, 1)}와 ${pct(I.constructionRate, 1)}의 ${pp(F.accidentGap, 1)}이고, 연으로 환산하면 1인당 ${won(F.constructionGapYear)}입니다. ` +
        `급여 자체의 ${pct(F.accidentGap, 1)}에 불과하지만 직원 ${I.employees}명이면 연 ${manwon(F.constructionGapYearTen)}으로, 업종 코드 하나가 그만큼의 고정비 차이를 만듭니다. ` +
        `산재 요율은 사업장 단위로 고시되므로 사무직 비중이 큰 건설 회사라면 실제 요율 확인이 이 편차를 줄이는 첫 단계입니다.`,
    },
    {
      h2: `퇴직급여 적립 ${won(F.retirement)}은 사업주 4대보험 ${won(F.employerIns)}의 ${pct(F.retireVsIns, 0)} — 끄면 부담률이 ${pct(F.overhead, 2)}에서 ${pct(F.noRetireOverhead, 2)}로 떨어진다`,
      body:
        `급여 ${manwon(I.defaultSalary)}의 퇴직급여 적립분은 급여의 12분의 1인 ${won(F.retirement)}입니다. 같은 급여에 사업주가 내는 4대보험 다섯 항목의 합 ${won(F.employerIns)}과 견주면 ${pct(F.retireVsIns, 0)}로, 항목 하나가 보험 다섯 개를 합친 것에 가깝습니다. ` +
        `토글을 끄면 사업주 추가 부담률은 ${pct(F.overhead, 2)}에서 ${pct(F.noRetireOverhead, 2)}로 ${pp(F.overheadDrop, 2)} 내려갑니다. ` +
        `1년 미만 근무자는 퇴직급여 지급 대상이 아니므로 이 토글은 "이 직원이 1년을 넘길 것인가"에 대한 답이고, 그 답이 인건비 추정에서 국민연금(${won(F.pensionEmployer)})보다 큰 항목을 넣고 뺍니다. ` +
        `채용 예산을 잡을 때 4대보험만 얹고 퇴직급여를 빼면 1인당 연 ${won(F.retirementYear)}이 빠지는 셈입니다.`,
    },
    {
      h2: `최저임금 ${won(I.minimumWage)} 직원의 사업주 부담은 ${won(F.minTotal)}, 근로자 손에는 ${won(F.minNet)} — 사이의 ${won(F.minGap)}은 실수령의 ${pct(F.minGapShare, 1)}`,
      body:
        `${won(I.minimumWage)}(시급 기준 월 ${I.monthlyHours}시간)을 넣으면 사업주 인건비는 퇴직급여 포함 ${won(F.minTotal)}, 근로자의 4대보험 공제 후 실수령은 소득세를 빼기 전에도 ${won(F.minNet)}입니다. ` +
        `사업주가 쓰는 돈과 근로자가 받는 돈 사이의 ${won(F.minGap)}은 실수령의 ${pct(F.minGapShare, 1)}이며, 이 비율은 국민연금 상한 아래에서는 급여가 얼마든 같습니다. ` +
        `즉 최저임금 인상분 1원은 사업주에게 약 ${num(F.costPerWon, 2)}원의 비용이고 근로자에게는 약 ${num(F.netPerWon, 2)}원의 실수령입니다. ` +
        `"최저임금이 얼마 올랐다"는 기사 속 숫자와 사업주 장부의 숫자가 다른 이유는 이 ${pct(F.minOverhead, 2)}의 얹힘입니다.`,
    },
    {
      h2: `${manwon(I.defaultSalary)} 직원 ${I.employees}명의 연 인건비는 ${manwon(F.tenAnnual)} — 급여 ${manwon(F.tenSalaryAnnual)}에 ${manwon(F.tenExtra)}이 얹힌다`,
      body:
        `직원 수를 ${I.employees}명으로 두면 월 인건비 합계 ${won(F.tenMonthly)}, 연 ${won(F.tenAnnual)}입니다. 이 가운데 급여로 나가는 돈은 연 ${manwon(F.tenSalaryAnnual)}이고 나머지 ${manwon(F.tenExtra)}이 4대보험과 퇴직급여 적립입니다. ` +
        `얹히는 금액은 1인 기준 월 ${won(F.extraPerHead)}의 ${I.employees}배·12배로, 계산기는 인원에 단순 비례합니다. 실제로는 고용보험 사업주 요율이 사업장 규모에 따라 달라지고 산재 요율도 사업장별로 고시되므로 이 비례는 소규모 사업장에서만 정확합니다. ` +
        `${manwon(F.tenExtra)}은 같은 급여의 직원을 약 ${num(F.extraHeads, 1)}명 더 고용할 수 있는 금액과 같습니다. ` +
        `채용 계획을 인원수로 세우는 대신 이 금액을 먼저 정해 두면 몇 명까지 가능한지가 거꾸로 나옵니다.`,
    },
    {
      h2: `근로자 공제율은 ${manwon(I.defaultSalary)}에서 ${pct(F.employeeShare, 2)}, ${manwon(I.salary20m)}에서 ${pct(F.employeeShare20, 2)} — 실수령 비율이 ${pct(F.netShare, 1)}에서 ${pct(F.net20Share, 1)}로 오른다`,
      body:
        `급여 ${manwon(I.defaultSalary)}의 근로자 4대보험 공제는 ${won(F.employeeIns)}으로 급여의 ${pct(F.employeeShare, 2)}이고, 실수령(소득세 전)은 ${won(F.net)}, 급여의 ${pct(F.netShare, 1)}입니다. ` +
        `급여 ${manwon(I.salary20m)}에서는 국민연금이 상한에 걸려 공제율이 ${pct(F.employeeShare20, 2)}로 낮아지고 실수령은 ${won(F.net20)}, 급여의 ${pct(F.net20Share, 1)}입니다. ` +
        `사업주 부담률이 ${pct(F.employerShare, 2)}에서 ${pct(F.employerShare20, 2)}로 내려가는 것과 같은 방향이며, 두 쪽 모두 국민연금 상한 하나가 만드는 굴절입니다. ` +
        `이 계산기는 소득세를 빼지 않으므로 실제 통장 입금액은 여기 실수령보다 작고, 그 차이는 급여가 클수록 커져 위의 상승을 상쇄합니다.`,
    },
  ],
};
