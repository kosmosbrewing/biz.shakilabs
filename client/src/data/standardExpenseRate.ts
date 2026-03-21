// 기준경비율·단순경비율 업종별 데이터 (2024년 귀속, 국세청 고시)
export const BIZ_EXPENSE_RATE_UPDATED = "2026.01";

export interface IndustryExpenseRate {
  key: string;
  label: string;
  /** 기준경비율 (%) */
  standardRate: number;
  /** 단순경비율 (%) */
  simpleRate: number;
  /** 단순경비율 적용 수입 기준 (만원) */
  simpleThreshold: number;
}

export const INDUSTRY_EXPENSE_RATES: IndustryExpenseRate[] = [
  { key: "it", label: "IT·소프트웨어", standardRate: 18.5, simpleRate: 64.1, simpleThreshold: 7500 },
  { key: "food", label: "음식점업", standardRate: 9.4, simpleRate: 87.4, simpleThreshold: 7500 },
  { key: "retail", label: "소매업", standardRate: 11.6, simpleRate: 86.5, simpleThreshold: 7500 },
  { key: "academy", label: "학원·교육", standardRate: 17.6, simpleRate: 72.5, simpleThreshold: 7500 },
  { key: "design", label: "디자인·광고", standardRate: 20.1, simpleRate: 64.7, simpleThreshold: 4000 },
  { key: "consulting", label: "경영컨설팅", standardRate: 19.0, simpleRate: 60.0, simpleThreshold: 4000 },
  { key: "realestate", label: "부동산중개", standardRate: 22.0, simpleRate: 59.7, simpleThreshold: 7500 },
  { key: "beauty", label: "미용·피부", standardRate: 16.3, simpleRate: 76.5, simpleThreshold: 7500 },
  { key: "medical", label: "의원·의료", standardRate: 17.1, simpleRate: 75.3, simpleThreshold: 7500 },
  { key: "construction", label: "건설업", standardRate: 12.7, simpleRate: 84.0, simpleThreshold: 7500 },
];

export const EXPENSE_RATE_REVENUE_PRESETS = [
  { label: "3천만", value: 30_000_000 },
  { label: "5천만", value: 50_000_000 },
  { label: "1억", value: 100_000_000 },
  { label: "2억", value: 200_000_000 },
];

export const EXPENSE_RATE_AMOUNTS = [3000, 5000, 10000, 20000, 30000];

export const EXPENSE_RATE_FAQS = [
  {
    q: "기준경비율과 단순경비율의 차이는?",
    a: "단순경비율은 매출에 일정 비율을 곱해 경비를 일괄 공제합니다. 기준경비율은 매입·임차·인건비를 실제 증빙으로 공제하고, 나머지만 기준경비율로 공제합니다.",
  },
  {
    q: "누가 단순경비율을 적용할 수 있나요?",
    a: "직전 과세기간 수입금액이 업종별 기준(대부분 7,500만원) 이하인 사업자가 적용할 수 있습니다. 신규 사업자도 해당 연도 수입이 기준 이하면 적용 가능합니다.",
  },
  {
    q: "기준경비율 적용 시 주요경비란?",
    a: "매입비용(상품·원재료 구입비), 임차료(사업장 월세), 인건비(직원 급여)가 해당합니다. 세금계산서, 계산서, 신용카드 등 적격증빙이 필요합니다.",
  },
];
