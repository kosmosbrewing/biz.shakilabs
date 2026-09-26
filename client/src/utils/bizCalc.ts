import {
  INCOME_TAX_BRACKETS,
  CORP_TAX_BRACKETS,
  DIVIDEND_TAX_RATE,
  DIVIDEND_LOCAL_TAX_RATE,
  LOCAL_INCOME_TAX_RATE,
  SOCIAL_INSURANCE,
} from "@/data/bizConstants";

// 보험료율 합계 — 사업장 요율은 사업주·근로자 몫으로 나뉘지만, 이 계산기의 두 주체는 둘 다 합계를 낸다.
// 개인사업자 본인(지역가입자)은 몫이 나뉘지 않아 본인이 전액을, 법인은 회사(사용자) 몫과 대표 본인 몫을 함께 낸다.
const PENSION_RATE = SOCIAL_INSURANCE.nationalPension.employer + SOCIAL_INSURANCE.nationalPension.employee; // 9.5%
const HEALTH_RATE = SOCIAL_INSURANCE.healthInsurance.employer + SOCIAL_INSURANCE.healthInsurance.employee; // 7.19%

/** 누진세 계산 공통 함수 */
function calcProgressiveTax(
  taxableIncome: number,
  brackets: readonly { min: number; max: number; rate: number; deduction: number }[],
): number {
  if (taxableIncome <= 0) return 0;
  for (const bracket of brackets) {
    if (taxableIncome <= bracket.max) {
      return taxableIncome * bracket.rate - bracket.deduction;
    }
  }
  const last = brackets[brackets.length - 1];
  return taxableIncome * last.rate - last.deduction;
}

export interface IndividualResult {
  revenue: number;
  expenses: number;
  taxableIncome: number;
  incomeTax: number;
  localTax: number;
  nationalPension: number;
  healthInsurance: number;
  longTermCare: number;
  totalTax: number;
  afterTaxIncome: number;
}

/** 개인사업자 세후소득 계산 */
export function calcIndividualAfterTax(revenue: number, expenseRate: number): IndividualResult {
  const expenses = revenue * expenseRate;
  const taxableIncome = Math.max(revenue - expenses, 0);

  const incomeTax = calcProgressiveTax(taxableIncome, INCOME_TAX_BRACKETS);
  const localTax = incomeTax * LOCAL_INCOME_TAX_RATE;

  // 개인사업자 본인의 보험료 (지역가입자, 사업소득 기준) — 국민연금·건강보험(+장기요양).
  // 요율은 근로자 몫(절반)이 아니라 전액이다:
  // - 국민연금: 지역가입자 연금보험료는 본인이 전부 부담한다(국민연금법 제88조제4항) — 2026년 기준소득월액의
  //   1천분의 95(같은 법 부칙 <제20903호, 2025.4.2.> 제4조제2항제1호). 직원을 둔 사업장의 사용자여도
  //   사업장가입자로서 기여금·부담금(각 1만분의 475)을 모두 본인이 내므로 합계가 같다.
  // - 건강보험: 지역가입자 보험료율 1만분의 719(국민건강보험법 시행령 제44조제1항)를 세대가 부담한다(법 제76조제3항).
  // - 건강보험 상한: 지역가입자 월별 보험료액 4,591,740원(고시 제2025-222호 제2조제2호)은 과세소득 약 7.66억원에서
  //   걸린다. 다이제스트가 매출 30억원까지 훑으므로(경비율 40%면 과세소득 18억원) 스캔 범위 안이라 반영한다.
  //   직원을 둔 사용자는 직장가입자라 상한이 보수월액보험료 기준(월 9,183,480원)으로 달라지지만, 이 모형은 직원 없는 개인 기준이다.
  // 고용·산재는 사업주 본인에게 당연 적용되지 않는다(자영업자 고용보험·산재 특례는 임의가입). 재산 보험료·하한은 모형 밖이다.
  const pensionBase = Math.min(taxableIncome / 12, SOCIAL_INSURANCE.nationalPension.upperLimit);
  const nationalPension = pensionBase * PENSION_RATE * 12;
  const healthInsurance = Math.min(taxableIncome * HEALTH_RATE, SOCIAL_INSURANCE.healthInsurance.monthlyCap.regional * 12);
  const longTermCare = healthInsurance * SOCIAL_INSURANCE.longTermCare.rate;

  const totalTax = incomeTax + localTax + nationalPension + healthInsurance + longTermCare;
  const afterTaxIncome = taxableIncome - totalTax;

  return {
    revenue,
    expenses,
    taxableIncome,
    incomeTax,
    localTax,
    nationalPension,
    healthInsurance,
    longTermCare,
    totalTax,
    afterTaxIncome,
  };
}

export interface CorpResult {
  revenue: number;
  expenses: number;
  operatingProfit: number;
  salary: number;
  corpTaxableIncome: number;
  corpTax: number;
  corpLocalTax: number;
  salaryIncomeTax: number;
  salaryLocalTax: number;
  /** 대표 급여의 국민연금 (회사·본인 몫 합계) */
  nationalPension: number;
  /** 대표 급여의 건강보험 (회사·본인 몫 합계) */
  healthInsurance: number;
  longTermCare: number;
  /** 국민연금 + 건강보험 + 장기요양 — 고용·산재는 대표이사에게 없다 */
  socialInsurance: number;
  dividendAmount: number;
  dividendTax: number;
  totalTax: number;
  afterTaxIncome: number;
}

/** 법인 세후소득 계산 (대표이사 급여 + 배당) */
export function calcCorpAfterTax(
  revenue: number,
  expenseRate: number,
  salary: number,
): CorpResult {
  const expenses = revenue * expenseRate;
  const operatingProfit = Math.max(revenue - expenses, 0);

  // 대표이사 급여는 법인 비용 처리
  const corpTaxableIncome = Math.max(operatingProfit - salary, 0);

  // 법인세
  const corpTax = calcProgressiveTax(corpTaxableIncome, CORP_TAX_BRACKETS);
  const corpLocalTax = corpTax * LOCAL_INCOME_TAX_RATE;

  // 대표이사 급여 소득세 (근로소득공제 간이 적용)
  const salaryDeduction = calcSalaryDeduction(salary);
  const salaryTaxable = Math.max(salary - salaryDeduction, 0);
  const salaryIncomeTax = calcProgressiveTax(salaryTaxable, INCOME_TAX_BRACKETS);
  const salaryLocalTax = salaryIncomeTax * LOCAL_INCOME_TAX_RATE;

  // 대표이사 급여의 보험료 — 국민연금·건강보험(+장기요양)만, 회사(사용자) 몫과 대표 본인 몫을 합산한다.
  // 두 법은 '근로자'에 "법인의 이사와 그 밖의 임원"을 명시한다(국민연금법 제3조제1항제1호, 국민건강보험법 제3조제1호).
  // 고용보험·산재보험의 근로자는 「근로기준법」상 근로자라(고용산재보험료징수법 제2조제2호, 산업재해보상보험법 제5조제2호)
  // 사용자 쪽인 대표이사는 당연 가입 대상이 아니다. 산재 중소기업 사업주 특례는 임의가입이라 기본 모형에서 뺀다.
  // 건강보험 상한(보수월액보험료 월 9,183,480원, 고시 제2025-222호 제2조제1호)은 연봉 약 15.3억원에서 걸린다.
  // 배당에 붙는 보수 외 소득월액보험료는 이 모형에 없다(배당은 법인세·배당소득세만 계산한다).
  const pensionBase = Math.min(salary / 12, SOCIAL_INSURANCE.nationalPension.upperLimit);
  const nationalPension = pensionBase * PENSION_RATE * 12;
  const healthInsurance = Math.min(salary * HEALTH_RATE, SOCIAL_INSURANCE.healthInsurance.monthlyCap.workplace * 12);
  const longTermCare = healthInsurance * SOCIAL_INSURANCE.longTermCare.rate;
  const socialInsurance = nationalPension + healthInsurance + longTermCare;

  // 잔여이익 배당
  const afterCorpTaxProfit = corpTaxableIncome - corpTax - corpLocalTax;
  const dividendAmount = Math.max(afterCorpTaxProfit, 0);
  const dividendTax = dividendAmount * (DIVIDEND_TAX_RATE + DIVIDEND_LOCAL_TAX_RATE);

  const totalTax = corpTax + corpLocalTax + salaryIncomeTax + salaryLocalTax + socialInsurance + dividendTax;
  const afterTaxIncome = operatingProfit - totalTax;

  return {
    revenue,
    expenses,
    operatingProfit,
    salary,
    corpTaxableIncome,
    corpTax,
    corpLocalTax,
    salaryIncomeTax,
    salaryLocalTax,
    nationalPension,
    healthInsurance,
    longTermCare,
    socialInsurance,
    dividendAmount,
    dividendTax,
    totalTax,
    afterTaxIncome,
  };
}

/** 근로소득공제 (2026년 기준) */
function calcSalaryDeduction(salary: number): number {
  if (salary <= 5_000_000) return salary * 0.7;
  if (salary <= 15_000_000) return 3_500_000 + (salary - 5_000_000) * 0.4;
  if (salary <= 45_000_000) return 7_500_000 + (salary - 15_000_000) * 0.15;
  if (salary <= 100_000_000) return 12_000_000 + (salary - 45_000_000) * 0.05;
  return 14_750_000 + (salary - 100_000_000) * 0.02;
}
