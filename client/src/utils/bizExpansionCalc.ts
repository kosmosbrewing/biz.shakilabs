import { z } from "zod";
import { CORP_TAX_BRACKETS } from "@/data/bizExpansionData";

const corpTaxSchema = z.object({
  taxableIncome: z.number().min(1_000_000).max(1_000_000_000_000),
});

const carExpenseSchema = z.object({
  annualCost: z.number().min(100_000).max(500_000_000),
  businessUseRate: z.number().min(0.1).max(1),
  taxRate: z.number().min(0.06).max(0.5),
});

const meetingCostSchema = z.object({
  attendees: z.number().int().min(2).max(200),
  costPerPerson: z.number().min(5_000).max(500_000),
  meetingsPerMonth: z.number().int().min(1).max(60),
  months: z.number().int().min(1).max(12),
  vatIncluded: z.boolean(),
});

export function calculateCorpTax(input: z.input<typeof corpTaxSchema>) {
  const parsed = corpTaxSchema.parse(input);
  let remaining = parsed.taxableIncome;
  let previousLimit = 0;
  let tax = 0;

  for (const bracket of CORP_TAX_BRACKETS) {
    const taxableSlice = Math.min(remaining, bracket.limit - previousLimit);
    if (taxableSlice <= 0) continue;
    tax += taxableSlice * bracket.rate;
    remaining -= taxableSlice;
    previousLimit = bracket.limit;
    if (remaining <= 0) {
      return {
        tax: Math.round(tax),
        afterTaxIncome: Math.round(parsed.taxableIncome - tax),
        effectiveRate: tax / parsed.taxableIncome,
        marginalRate: bracket.rate,
        bracketLabel: bracket.label,
      };
    }
  }

  return { tax: 0, afterTaxIncome: parsed.taxableIncome, effectiveRate: 0, marginalRate: 0, bracketLabel: "-" };
}

export function calculateCarExpenseDeduction(input: z.input<typeof carExpenseSchema>) {
  const parsed = carExpenseSchema.parse(input);
  const deductibleAmount = Math.round(parsed.annualCost * parsed.businessUseRate);
  const nonDeductibleAmount = Math.round(parsed.annualCost - deductibleAmount);
  const taxSaving = Math.round(deductibleAmount * parsed.taxRate);

  return {
    deductibleAmount,
    nonDeductibleAmount,
    taxSaving,
    logbookAdvice: parsed.businessUseRate >= 0.8 ? "운행기록부와 업무전용보험 유지 권장" : "업무 사용비율 근거 보관 권장",
  };
}

export function calculateMeetingCost(input: z.input<typeof meetingCostSchema>) {
  const parsed = meetingCostSchema.parse(input);
  const perMeeting = parsed.attendees * parsed.costPerPerson;
  const monthlyBudget = perMeeting * parsed.meetingsPerMonth;
  const annualBudget = monthlyBudget * parsed.months;
  const vatCredit = parsed.vatIncluded ? Math.round(annualBudget / 11) : 0;

  return {
    perMeeting,
    monthlyBudget,
    annualBudget,
    vatCredit,
    annualPerPerson: Math.round(annualBudget / parsed.attendees),
  };
}
