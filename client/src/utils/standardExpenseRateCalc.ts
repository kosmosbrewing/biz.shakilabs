import { z } from "zod";
import { INCOME_TAX_BRACKETS, LOCAL_INCOME_TAX_RATE } from "@/data/bizConstants";

const schema = z.object({
  revenue: z.number().min(0).max(10_000_000_000),
  /** 기준경비율 (%, 0~100) */
  standardRate: z.number().min(0).max(100),
  /** 단순경비율 (%, 0~100) */
  simpleRate: z.number().min(0).max(100),
  /** 주요경비: 매입비 */
  purchaseCost: z.number().min(0),
  /** 주요경비: 임차료 */
  rentCost: z.number().min(0),
  /** 주요경비: 인건비 */
  laborCost: z.number().min(0),
});

export type StandardExpenseRateInput = z.input<typeof schema>;

export interface ExpenseRateMethodResult {
  expenses: number;
  taxableIncome: number;
  incomeTax: number;
  localTax: number;
  totalTax: number;
  afterTaxIncome: number;
  effectiveRate: number;
}

export interface StandardExpenseRateResult {
  standard: ExpenseRateMethodResult;
  simple: ExpenseRateMethodResult;
  taxDifference: number;
  recommendation: "standard" | "simple";
  majorExpenses: number;
}

function calcProgressiveTax(taxableIncome: number): number {
  if (taxableIncome <= 0) return 0;
  for (const bracket of INCOME_TAX_BRACKETS) {
    if (taxableIncome <= bracket.max) {
      return Math.round(taxableIncome * bracket.rate - bracket.deduction);
    }
  }
  return 0;
}

function buildMethodResult(
  revenue: number,
  expenses: number
): ExpenseRateMethodResult {
  const taxableIncome = Math.max(0, Math.round(revenue - expenses));
  const incomeTax = calcProgressiveTax(taxableIncome);
  const localTax = Math.round(incomeTax * LOCAL_INCOME_TAX_RATE);
  const totalTax = incomeTax + localTax;
  const afterTaxIncome = taxableIncome - totalTax;
  const effectiveRate = revenue > 0 ? totalTax / revenue : 0;

  return { expenses, taxableIncome, incomeTax, localTax, totalTax, afterTaxIncome, effectiveRate };
}

export function calculateStandardExpenseRate(
  input: StandardExpenseRateInput
): StandardExpenseRateResult {
  const parsed = schema.parse(input);

  const majorExpenses = parsed.purchaseCost + parsed.rentCost + parsed.laborCost;

  // 기준경비율: 매출 - 주요경비 - (매출 × 기준경비율%)
  const standardExpenses = majorExpenses + Math.round(parsed.revenue * (parsed.standardRate / 100));
  const standard = buildMethodResult(parsed.revenue, standardExpenses);

  // 단순경비율: 매출 × 단순경비율%
  const simpleExpenses = Math.round(parsed.revenue * (parsed.simpleRate / 100));
  const simple = buildMethodResult(parsed.revenue, simpleExpenses);

  const taxDifference = simple.totalTax - standard.totalTax;
  const recommendation = standard.totalTax <= simple.totalTax ? "standard" : "simple";

  return { standard, simple, taxDifference, recommendation, majorExpenses };
}
