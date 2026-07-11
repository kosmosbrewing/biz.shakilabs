export const BIZ_SERVICE_UPDATED_AT = "2026-07-10";

export const CORP_TAX_SOURCE_URL =
  "https://www.nts.go.kr/nts/cm/cntnts/cntntsView.do?cntntsId=7746&mi=2320";

/** 법인세에 지방법인소득세(법인세의 10%)를 더한 계산용 세율 */
export const CORP_TAX_BRACKETS = [
  { limit: 200_000_000, rate: 0.11, label: "2억원 이하" },
  { limit: 20_000_000_000, rate: 0.22, label: "200억원 이하" },
  { limit: 300_000_000_000, rate: 0.242, label: "3,000억원 이하" },
  { limit: Number.POSITIVE_INFINITY, rate: 0.275, label: "3,000억원 초과" },
] as const;
