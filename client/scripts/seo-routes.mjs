// 파라미터 단위: 만 원 (URL 파라미터 × 10,000 = 원화)
export const INDIVIDUAL_VS_CORP_REVENUES = [5000, 10000, 20000, 50000];
export const CORP_TAX_REVENUES = [10000, 20000, 50000, 100000];
export const VAT_COMPARE_REVENUES = [3000, 5000, 8000, 10000];
export const STANDARD_EXPENSE_RATE_REVENUES = [3000, 5000, 10000, 20000, 30000];
export const LABOR_COST_AMOUNTS = [210, 250, 300, 400, 500];

// 준-doorway 통합 (애드센스 "가치가 별로 없는 콘텐츠" 대응):
// 금액 변형 라우트는 기본 계산기와 프리렌더 본문이 사실상 동일해서
// (형제 간 고유 텍스트 ~3%) 보강 대신 통합한다 — canonical은 기본 페이지로,
// 사이트맵에서는 제외. noindex가 아니므로 변형에 쌓인 신호는 기본 페이지로 합쳐진다.
//
// 전수 유사도 측정(태그 제거 difflib) 결과 5개 패밀리 모두 최악 쌍이 1.0000이었다.
// 즉 부모와 100% 동일한 변형이 각 패밀리마다 최소 하나씩 존재한다:
//   /labor-cost(5) /corp-tax(4) /standard-expense-rate(5)
//   /individual-vs-corp(4) /vat-compare(4)
// 대표 페이지는 전부 1,500자를 넘으므로(2,086~2,945자) 통합만으로 충분하다.
//
// 가역적 결정: 변형이 고유 본문을 갖게 되면 해당 패밀리를 이 배열에서 빼기만 하면
// 사이트맵 복귀와 self-canonical 복원이 동시에 이뤄진다.
export const PARAM_ROUTES = [
  ...LABOR_COST_AMOUNTS.map((a) => `/labor-cost/${a}`),
  ...CORP_TAX_REVENUES.map((a) => `/corp-tax/${a}`),
  ...STANDARD_EXPENSE_RATE_REVENUES.map((a) => `/standard-expense-rate/${a}`),
  ...INDIVIDUAL_VS_CORP_REVENUES.map((a) => `/individual-vs-corp/${a}`),
  ...VAT_COMPARE_REVENUES.map((a) => `/vat-compare/${a}`),
];

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
  "/standard-expense-rate",
  // 금액 변형은 전부 PARAM_ROUTES에 모여 있다. 여기에 개별로 다시 나열하면
  // 사이트맵 제외·canonical 통합이 한쪽에만 적용되어 신호가 어긋난다.
  ...PARAM_ROUTES,
];

// 사이트맵에는 self-canonical 페이지만 올린다. canonical이 다른 곳을 가리키는
// PARAM_ROUTES를 광고하면 크롤러를 "곧바로 딴 데를 가리키는 URL"로 보내게 된다.
export const SITEMAP_ROUTES = SEO_ROUTES.filter(
  (route) => !PARAM_ROUTES.includes(route)
);

// 프리렌더된 라우트의 canonical 대상: 금액 변형은 마지막 세그먼트를 떼어낸
// 기본 계산기 페이지로, 나머지는 전부 self-canonical.
export function canonicalPathFor(route) {
  return PARAM_ROUTES.includes(route)
    ? route.slice(0, route.lastIndexOf("/"))
    : route;
}

// PARAM_ROUTES는 의도적으로 SEO_ROUTES(=프리렌더 대상)에 남긴다: 정적 HTML이
// 없으면 Vercel rewrite가 SPA 셸을 내려보내 크롤러에게 soft-404가 된다.
// 절대 프리렌더 대상에서 빼지 말 것.
