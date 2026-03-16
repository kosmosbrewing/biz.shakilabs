export interface BreakEvenResult {
  fixedCosts: number;
  variableCostRate: number;
  breakEvenRevenue: number;
  breakEvenDays: number;
  monthlyOperatingDays: number;
  dailyBreakEvenRevenue: number;
}

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
