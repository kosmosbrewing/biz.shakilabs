/** 2026년 기준 사업자 관련 세율·요율 상수 */

export const BIZ_DATA_UPDATED = "2026-03-15";
export const BIZ_DATA_VERIFIED = "2026-03-15";

// 소득세 누진세율 (종합소득세 = 개인사업자)
export const INCOME_TAX_BRACKETS = [
  { min: 0, max: 14_000_000, rate: 0.06, deduction: 0 },
  { min: 14_000_000, max: 50_000_000, rate: 0.15, deduction: 1_260_000 },
  { min: 50_000_000, max: 88_000_000, rate: 0.24, deduction: 5_760_000 },
  { min: 88_000_000, max: 150_000_000, rate: 0.35, deduction: 15_440_000 },
  { min: 150_000_000, max: 300_000_000, rate: 0.38, deduction: 19_940_000 },
  { min: 300_000_000, max: 500_000_000, rate: 0.40, deduction: 25_940_000 },
  { min: 500_000_000, max: 1_000_000_000, rate: 0.42, deduction: 35_940_000 },
  { min: 1_000_000_000, max: Infinity, rate: 0.45, deduction: 65_940_000 },
] as const;

// 법인세율 (2026년 기준)
export const CORP_TAX_BRACKETS = [
  { min: 0, max: 200_000_000, rate: 0.09, deduction: 0 },
  { min: 200_000_000, max: 20_000_000_000, rate: 0.19, deduction: 20_000_000 },
  { min: 20_000_000_000, max: 300_000_000_000, rate: 0.21, deduction: 420_000_000 },
  { min: 300_000_000_000, max: Infinity, rate: 0.24, deduction: 9_420_000_000 },
] as const;

// 배당소득세 (법인→대표 배당 시)
export const DIVIDEND_TAX_RATE = 0.14;
export const DIVIDEND_LOCAL_TAX_RATE = 0.014; // 지방소득세

// 지방소득세 (소득세의 10%)
export const LOCAL_INCOME_TAX_RATE = 0.1;

// 4대보험 요율 (2026년 기준, 사업주 부담분 포함)
export const SOCIAL_INSURANCE = {
  // 국민연금: 사업주 4.75% + 근로자 4.75% = 9.5%
  nationalPension: { employer: 0.0475, employee: 0.0475, upperLimit: 6_370_000 },
  // 건강보험: 사업주 3.595% + 근로자 3.595% = 7.19%
  healthInsurance: { employer: 0.03595, employee: 0.03595 },
  // 장기요양: 건보의 13.14%
  longTermCare: { rate: 0.1314 },
  // 고용보험: 사업주 0.9% (150인 미만) + 근로자 0.9%
  employmentInsurance: { employer: 0.009, employee: 0.009 },
  // 산재보험: 업종별 상이, 평균 약 1.47% (사업주 전액)
  industrialAccident: { employer: 0.0147 },
} as const;

export const DEFAULT_SIMPLIFIED_TAX_THRESHOLD = 104_000_000;
export const SPECIAL_SIMPLIFIED_TAX_THRESHOLD = 48_000_000;
export const SIMPLIFIED_TAX_EXEMPT_THRESHOLD = 48_000_000;

export interface SimplifiedVatRateInfo {
  label: string;
  rate: number;
  eligibilityThreshold: number;
}

// 간이과세 업종별 부가가치율 (2026년 기준)
export const SIMPLIFIED_VAT_RATES: Record<string, SimplifiedVatRateInfo> = {
  retail: {
    label: "소매업",
    rate: 0.15,
    eligibilityThreshold: DEFAULT_SIMPLIFIED_TAX_THRESHOLD,
  },
  manufacturing: {
    label: "제조업·농림어업",
    rate: 0.20,
    eligibilityThreshold: DEFAULT_SIMPLIFIED_TAX_THRESHOLD,
  },
  food: {
    label: "음식점업",
    rate: 0.15,
    eligibilityThreshold: DEFAULT_SIMPLIFIED_TAX_THRESHOLD,
  },
  service: {
    label: "그 밖의 서비스업",
    rate: 0.30,
    eligibilityThreshold: DEFAULT_SIMPLIFIED_TAX_THRESHOLD,
  },
  realestate: {
    label: "부동산임대업",
    rate: 0.40,
    eligibilityThreshold: SPECIAL_SIMPLIFIED_TAX_THRESHOLD,
  },
  entertainment: {
    label: "과세유흥장소",
    rate: 0.40,
    eligibilityThreshold: SPECIAL_SIMPLIFIED_TAX_THRESHOLD,
  },
};

// 배달앱 수수료율 (2026년 기준)
export interface DeliveryAppFee {
  name: string;
  key: string;
  color: string;
  /** 중개 수수료율 */
  commissionRate: number;
  /** 광고비 (월 고정/건당 등 표기) */
  adFeeDesc: string;
  /** 결제 수수료율 */
  paymentFeeRate: number;
  /** 배달대행료 평균 (건당) */
  avgDeliveryFee: number;
  /** 비고 */
  note: string;
}

export const DELIVERY_APPS: DeliveryAppFee[] = [
  {
    name: "배달의민족",
    key: "baemin",
    color: "#2AC1BC",
    commissionRate: 0.066,
    adFeeDesc: "울트라콜 월 88,000원 / 오픈리스트 6.8%",
    paymentFeeRate: 0.033,
    avgDeliveryFee: 3500,
    note: "울트라콜+오픈리스트 병행 가장 흔함",
  },
  {
    name: "쿠팡이츠",
    key: "coupangeats",
    color: "#E84C3D",
    commissionRate: 0.099,
    adFeeDesc: "없음 (수수료 포함)",
    paymentFeeRate: 0.0,
    avgDeliveryFee: 3300,
    note: "중개수수료에 결제수수료 포함",
  },
  {
    name: "요기요",
    key: "yogiyo",
    color: "#FA0050",
    commissionRate: 0.125,
    adFeeDesc: "없음 (수수료 포함)",
    paymentFeeRate: 0.0,
    avgDeliveryFee: 3400,
    note: "2024년 수수료 인하 (15.7→12.5%)",
  },
];

// 소상공인 업종별 평균 경비율 참고 (BEP 계산용)
export const INDUSTRY_EXPENSE_RATIOS: Record<string, { label: string; fixedRatio: number; variableRatio: number }> = {
  food: { label: "음식점", fixedRatio: 0.30, variableRatio: 0.35 },
  cafe: { label: "카페", fixedRatio: 0.35, variableRatio: 0.25 },
  retail: { label: "소매업", fixedRatio: 0.20, variableRatio: 0.55 },
  service: { label: "서비스업", fixedRatio: 0.40, variableRatio: 0.20 },
  beauty: { label: "미용실", fixedRatio: 0.45, variableRatio: 0.15 },
};
