import {
  INCOME_TAX_BRACKETS,
  CORP_TAX_BRACKETS,
  DIVIDEND_TAX_RATE,
  DIVIDEND_LOCAL_TAX_RATE,
  LOCAL_INCOME_TAX_RATE,
  SOCIAL_INSURANCE,
} from "@/data/bizConstants";

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

  // 지역가입자 4대보험 (사업소득 기준)
  const pensionBase = Math.min(taxableIncome / 12, SOCIAL_INSURANCE.nationalPension.upperLimit);
  const nationalPension = pensionBase * SOCIAL_INSURANCE.nationalPension.employee * 12;
  const healthInsurance = taxableIncome * SOCIAL_INSURANCE.healthInsurance.employee;
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

  // 4대보험 (사업주 + 근로자 합산)
  const pensionBase = Math.min(salary / 12, SOCIAL_INSURANCE.nationalPension.upperLimit);
  const pension = pensionBase * (SOCIAL_INSURANCE.nationalPension.employer + SOCIAL_INSURANCE.nationalPension.employee) * 12;
  const health = salary * (SOCIAL_INSURANCE.healthInsurance.employer + SOCIAL_INSURANCE.healthInsurance.employee);
  const ltc = health * SOCIAL_INSURANCE.longTermCare.rate;
  const employment = salary * (SOCIAL_INSURANCE.employmentInsurance.employer + SOCIAL_INSURANCE.employmentInsurance.employee);
  const industrial = salary * SOCIAL_INSURANCE.industrialAccident.employer;
  const socialInsurance = pension + health + ltc + employment + industrial;

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
