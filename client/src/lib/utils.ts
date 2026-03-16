import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

// 숫자 포맷: 1000 → "1,000"
export function formatNumber(num: number | null | undefined): string {
  if (num == null) return "-";
  return num.toLocaleString("ko-KR");
}

// 원화 원단위 포맷: 2345678 → "2,345,678원"
export function formatWon(amount: number | null | undefined): string {
  if (amount == null) return "-";
  return `${Math.round(amount).toLocaleString("ko-KR")}원`;
}

// 축약 원화 포맷 (공유카드, SummaryBanner용): 2490000 → "약 249만원"
export function formatWonShort(amount: number | null | undefined): string {
  if (amount == null) return "-";
  const abs = Math.abs(amount);
  const sign = amount < 0 ? "-" : "";

  if (abs >= 100_000_000) {
    const eok = Math.floor(abs / 100_000_000);
    const restMan = Math.round((abs % 100_000_000) / 10_000);
    if (restMan === 0) return `${sign}${eok}억원`;
    return `${sign}${eok}억 ${restMan.toLocaleString("ko-KR")}만원`;
  }

  if (abs >= 10_000) {
    const man = Math.round(abs / 10_000);
    return `${sign}${man.toLocaleString("ko-KR")}만원`;
  }

  return `${sign}${Math.round(abs).toLocaleString("ko-KR")}원`;
}

// 퍼센트 포맷: 0.1234 → "12.3%"
export function formatPercent(rate: number | null | undefined, decimals = 1): string {
  if (rate == null) return "-";
  return `${(rate * 100).toFixed(decimals)}%`;
}

// 통화 포맷: (14900, "KRW") → "₩14,900"
export function formatCurrency(amount: number | null | undefined, currency: string): string {
  if (amount == null) return "-";
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "KRW" ? 0 : 2,
  }).format(amount);
}

// execCommand 기반 클립보드 복사 (Clipboard API 미지원 환경 폴백)
export function copyUsingExecCommand(text: string): boolean {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();

  let copied = false;
  try {
    copied = document.execCommand("copy");
  } catch {
    copied = false;
  }

  document.body.removeChild(textarea);
  return copied;
}
