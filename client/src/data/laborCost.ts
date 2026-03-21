// 인건비 계산기 — 2026년 기준
// 출처: 국민연금공단, 건강보험공단, 고용노동부

export const LABOR_COST_UPDATED = "2026-03-19";

/** 2026년 최저시급 */
export const MINIMUM_WAGE_2026 = 10_030;

/** 주휴수당 포함 월 최저임금 (209시간 기준) */
export const MINIMUM_MONTHLY_WAGE_2026 = Math.round(MINIMUM_WAGE_2026 * 209);

/** 산재보험 업종별 요율 (사업주 전액 부담) */
export interface IndustryAccidentRate {
  key: string;
  label: string;
  rate: number;
}

export const INDUSTRY_ACCIDENT_RATES: IndustryAccidentRate[] = [
  { key: "office", label: "사무직 (금융·IT·서비스)", rate: 0.007 },
  { key: "retail", label: "도소매·음식숙박업", rate: 0.009 },
  { key: "manufacturing", label: "제조업", rate: 0.012 },
  { key: "construction", label: "건설업", rate: 0.037 },
  { key: "transport", label: "운수·창고업", rate: 0.018 },
  { key: "average", label: "전 업종 평균", rate: 0.0147 },
];

export const LABOR_COST_SALARY_PRESETS = [
  { value: MINIMUM_MONTHLY_WAGE_2026, label: "최저임금" },
  { value: 2_500_000, label: "250만" },
  { value: 3_000_000, label: "300만" },
  { value: 4_000_000, label: "400만" },
  { value: 5_000_000, label: "500만" },
];

export const LABOR_COST_AMOUNTS = [210, 250, 300, 400, 500];

export const LABOR_COST_FAQS: readonly { q: string; a: string }[] = [
  {
    q: "인건비에는 어떤 항목이 포함되나요?",
    a: "인건비 = 급여(월급) + 사업주 부담 4대보험(국민연금 4.75%, 건강보험 3.595%, 장기요양 건보의 13.14%, 고용보험 0.9%, 산재보험 업종별)입니다. 퇴직급여 적립분(약 8.33%)도 포함하면 실제 인건비는 더 늘어납니다.",
  },
  {
    q: "산재보험 요율은 어떻게 결정되나요?",
    a: "산재보험은 업종별로 요율이 다르며 사업주가 전액 부담합니다. 사무직은 약 0.7%, 제조업 1.2%, 건설업 3.7% 등으로 업종별 재해 위험도에 따라 결정됩니다.",
  },
  {
    q: "국민연금 상한액은 얼마인가요?",
    a: "2026년 기준 월 기준소득월액 상한은 637만원입니다. 월급이 이를 초과하더라도 국민연금은 637만원 기준으로 산정됩니다.",
  },
  {
    q: "퇴직급여는 어떻게 계산하나요?",
    a: "1년 이상 근무한 직원에게 퇴직 시 30일분 이상의 평균임금을 지급해야 합니다. 월급의 약 1/12(8.33%)를 퇴직급여 적립분으로 계산합니다.",
  },
];
