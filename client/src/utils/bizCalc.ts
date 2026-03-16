import {
  INCOME_TAX_BRACKETS,
  CORP_TAX_BRACKETS,
  DIVIDEND_TAX_RATE,
  DIVIDEND_LOCAL_TAX_RATE,
  LOCAL_INCOME_TAX_RATE,
  SOCIAL_INSURANCE,
  SIMPLIFIED_VAT_RATES,
  SIMPLIFIED_TAX_EXEMPT_THRESHOLD,
  DELIVERY_APPS,
  type DeliveryAppFee,
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

export interface BreakEvenResult {
  fixedCosts: number;
  variableCostRate: number;
  breakEvenRevenue: number;
  breakEvenDays: number;
  monthlyOperatingDays: number;
  dailyBreakEvenRevenue: number;
}

/** 손익분기점 계산 */
export function calcBreakEven(
  fixedCosts: number,
  variableCostRate: number,
  operatingDays: number,
): BreakEvenResult {
  const contributionMarginRate = 1 - variableCostRate;
  const breakEvenRevenue = contributionMarginRate > 0
    ? fixedCosts / contributionMarginRate
    : 0;
  const dailyBreakEvenRevenue = operatingDays > 0
    ? breakEvenRevenue / operatingDays
    : 0;

  return {
    fixedCosts,
    variableCostRate,
    breakEvenRevenue,
    breakEvenDays: operatingDays,
    monthlyOperatingDays: operatingDays,
    dailyBreakEvenRevenue,
  };
}

export interface VatCompareResult {
  annualRevenue: number;
  industryKey: string;
  /** 일반과세: 매출세액 - 매입세액 */
  generalVat: number;
  /** 간이과세: 매출액 × 부가가치율 × 10% */
  simplifiedVat: number;
  /** 간이과세 납부면제 여부 */
  isSimplifiedExempt: boolean;
  /** 간이과세 적격 여부 */
  isSimplifiedEligible: boolean;
  difference: number;
  recommendation: "general" | "simplified";
}

/** 간이과세 vs 일반과세 부가세 비교 */
export function calcVatCompare(
  annualRevenue: number,
  industryKey: string,
  purchaseRate: number,
): VatCompareResult {
  const vatRate = SIMPLIFIED_VAT_RATES[industryKey]?.rate ?? 0.30;

  // 일반과세: 매출세액(10%) - 매입세액
  const generalOutputVat = annualRevenue * 0.1;
  const generalInputVat = (annualRevenue * purchaseRate) * 0.1;
  const generalVat = Math.max(generalOutputVat - generalInputVat, 0);

  // 간이과세: 매출액 × 업종별 부가가치율 × 10%
  const simplifiedVat = annualRevenue * vatRate * 0.1;
  const isSimplifiedExempt = annualRevenue < SIMPLIFIED_TAX_EXEMPT_THRESHOLD;
  const isSimplifiedEligible = annualRevenue < 108_000_000;

  const effectiveSimplifiedVat = isSimplifiedExempt ? 0 : simplifiedVat;
  const difference = generalVat - effectiveSimplifiedVat;
  const recommendation = effectiveSimplifiedVat <= generalVat ? "simplified" : "general";

  return {
    annualRevenue,
    industryKey,
    generalVat,
    simplifiedVat: effectiveSimplifiedVat,
    isSimplifiedExempt,
    isSimplifiedEligible,
    difference,
    recommendation,
  };
}

export interface DeliveryFeeResult {
  appName: string;
  appKey: string;
  color: string;
  orderAmount: number;
  monthlyOrders: number;
  commission: number;
  paymentFee: number;
  deliveryFee: number;
  totalFee: number;
  netRevenue: number;
  feeRate: number;
}

/** 배달앱별 수수료 계산 */
export function calcDeliveryFees(
  orderAmount: number,
  monthlyOrders: number,
  apps: DeliveryAppFee[] = DELIVERY_APPS,
): DeliveryFeeResult[] {
  return apps.map((app) => {
    const commission = orderAmount * app.commissionRate * monthlyOrders;
    const paymentFee = orderAmount * app.paymentFeeRate * monthlyOrders;
    const deliveryFee = app.avgDeliveryFee * monthlyOrders;
    const totalFee = commission + paymentFee + deliveryFee;
    const totalRevenue = orderAmount * monthlyOrders;
    const netRevenue = totalRevenue - totalFee;
    const feeRate = totalRevenue > 0 ? totalFee / totalRevenue : 0;

    return {
      appName: app.name,
      appKey: app.key,
      color: app.color,
      orderAmount,
      monthlyOrders,
      commission,
      paymentFee,
      deliveryFee,
      totalFee,
      netRevenue,
      feeRate,
    };
  });
}
