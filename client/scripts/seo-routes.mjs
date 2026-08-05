// 파라미터 단위: 만 원 (URL 파라미터 × 10,000 = 원화)
export const INDIVIDUAL_VS_CORP_REVENUES = [5000, 10000, 20000, 50000];
export const CORP_TAX_REVENUES = [10000, 20000, 50000, 100000];
export const VAT_COMPARE_REVENUES = [3000, 5000, 8000, 10000];
export const STANDARD_EXPENSE_RATE_REVENUES = [3000, 5000, 10000, 20000, 30000];
export const LABOR_COST_AMOUNTS = [210, 250, 300, 400, 500];

// 준-doorway 통합 (애드센스 "가치가 별로 없는 콘텐츠" 대응):
// labor-cost 금액 변형은 기본 계산기와 프리렌더 본문이 사실상 동일해서
// (형제 간 고유 텍스트 ~3%) 보강 대신 통합한다 — canonical은 /labor-cost로,
// 사이트맵에서는 제외. noindex가 아니므로 변형에 쌓인 신호는 기본 페이지로 합쳐진다.
// 가역적 결정: 변형이 고유 본문을 갖게 되면 사이트맵에 복귀시키고 canonical 오버라이드를 제거하면 된다.
export const PARAM_ROUTES = LABOR_COST_AMOUNTS.map((a) => `/labor-cost/${a}`);

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
  ...PARAM_ROUTES,
];

// 사이트맵에는 self-canonical 페이지만 올린다. canonical이 다른 곳을 가리키는
// PARAM_ROUTES를 광고하면 크롤러를 "곧바로 딴 데를 가리키는 URL"로 보내게 된다.
export const SITEMAP_ROUTES = SEO_ROUTES.filter(
  (route) => !PARAM_ROUTES.includes(route)
);

// 프리렌더된 라우트의 canonical 대상: labor-cost 변형은 기본 페이지(/labor-cost)로,
// 나머지는 전부 self-canonical.
export function canonicalPathFor(route) {
  return PARAM_ROUTES.includes(route)
    ? route.slice(0, route.lastIndexOf("/"))
    : route;
}

// PARAM_ROUTES는 의도적으로 SEO_ROUTES(=프리렌더 대상)에 남긴다: 정적 HTML이
// 없으면 Vercel rewrite가 SPA 셸을 내려보내 크롤러에게 soft-404가 된다.
// 절대 프리렌더 대상에서 빼지 말 것.
