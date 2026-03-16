import {
  DEFAULT_SIMPLIFIED_TAX_THRESHOLD,
  SIMPLIFIED_TAX_EXEMPT_THRESHOLD,
  SIMPLIFIED_VAT_RATES,
} from "@/data/bizConstants";

export interface VatCompareResult {
  annualRevenue: number;
  industryKey: string;
  generalVat: number;
  simplifiedVat: number;
  isSimplifiedExempt: boolean;
  isSimplifiedEligible: boolean;
  simplifiedThreshold: number;
  difference: number;
  recommendation: "general" | "simplified";
}

export function calcVatCompare(
  annualRevenue: number,
  industryKey: string,
  purchaseRate: number,
): VatCompareResult {
  const industry = SIMPLIFIED_VAT_RATES[industryKey];
  const vatRate = industry?.rate ?? 0.30;
  const simplifiedThreshold = industry?.eligibilityThreshold ?? DEFAULT_SIMPLIFIED_TAX_THRESHOLD;

  const generalOutputVat = annualRevenue * 0.1;
  const generalInputVat = annualRevenue * purchaseRate * 0.1;
  const generalVat = Math.max(generalOutputVat - generalInputVat, 0);

  const simplifiedVat = annualRevenue * vatRate * 0.1;
  const isSimplifiedExempt = annualRevenue < SIMPLIFIED_TAX_EXEMPT_THRESHOLD;
  const isSimplifiedEligible = annualRevenue < simplifiedThreshold;

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
    simplifiedThreshold,
    difference,
    recommendation,
  };
}
