// 2차 내비(BizTabNavigation)와 모바일 드로어(AppHeader)가 같은 출처를 쓰도록 분리한 목록.
// 레시피 §3 — "목록을 복제하지 마라".
import type { PrimaryNavigationItem } from "@shakilabs/ui";

export const BIZ_TOOLS: readonly PrimaryNavigationItem[] = [
  { key: "home", label: "사업 도구", to: "/", href: "/biz" },
  { key: "individual-vs-corp", label: "개인 vs 법인", to: "/individual-vs-corp" },
  { key: "break-even", label: "손익분기점", to: "/break-even" },
  { key: "vat-compare", label: "부가세 비교", to: "/vat-compare" },
  { key: "delivery-fee", label: "배달앱 수수료", to: "/delivery-fee" },
  { key: "corp-tax", label: "법인세 계산", to: "/corp-tax" },
  { key: "car-expense", label: "차량 경비", to: "/car-expense" },
  { key: "meeting-cost", label: "회의 비용", to: "/meeting-cost" },
];
