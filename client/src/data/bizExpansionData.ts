export const BIZ_SERVICE_UPDATED_AT = "2026-03-16";

export const CORP_TAX_BRACKETS = [
  { limit: 200_000_000, rate: 0.099, label: "2억원 이하" },
  { limit: 20_000_000_000, rate: 0.209, label: "200억원 이하" },
  { limit: 300_000_000_000, rate: 0.231, label: "3,000억원 이하" },
  { limit: Number.POSITIVE_INFINITY, rate: 0.264, label: "3,000억원 초과" },
] as const;
