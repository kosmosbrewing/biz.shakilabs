// 파라미터 단위: 만 원 (URL 파라미터 × 10,000 = 원화)
export const INDIVIDUAL_VS_CORP_REVENUES = [5000, 10000, 20000, 50000];
export const CORP_TAX_REVENUES = [10000, 20000, 50000, 100000];
export const VAT_COMPARE_REVENUES = [3000, 5000, 8000, 10000];
export const STANDARD_EXPENSE_RATE_REVENUES = [3000, 5000, 10000, 20000, 30000];
export const LABOR_COST_AMOUNTS = [210, 250, 300, 400, 500];

export const SEO_ROUTES = [
  "/",
  "/individual-vs-corp",
  "/break-even",
  "/vat-compare",
  "/delivery-fee",
  "/corp-tax",
  "/car-expense",
  "/meeting-cost",
  "/labor-cost",
  "/about",
  "/terms",
  "/privacy",
  ...INDIVIDUAL_VS_CORP_REVENUES.map((a) => `/individual-vs-corp/${a}`),
  ...CORP_TAX_REVENUES.map((a) => `/corp-tax/${a}`),
  ...VAT_COMPARE_REVENUES.map((a) => `/vat-compare/${a}`),
  "/standard-expense-rate",
  ...STANDARD_EXPENSE_RATE_REVENUES.map((a) => `/standard-expense-rate/${a}`),
  ...LABOR_COST_AMOUNTS.map((a) => `/labor-cost/${a}`),
];
