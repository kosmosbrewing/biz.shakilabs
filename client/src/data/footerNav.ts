import type { SiteFooterLink, SiteFooterSection } from "@shakilabs/ui";

/** 푸터 계산기 목록 — 라우터의 실제 경로만 담는다(리다이렉트 별칭 제외) */
export const FOOTER_SECTIONS: readonly SiteFooterSection[] = [
  {
    title: "사업 형태·세금",
    links: [
    { to: "/individual-vs-corp", label: "개인 vs 법인" },
    { to: "/corp-tax", label: "법인세" },
    { to: "/vat-compare", label: "간이 vs 일반과세" },
    { to: "/standard-expense-rate", label: "기준경비율" },
    ],
  },
  {
    title: "비용·수익",
    links: [
    { to: "/break-even", label: "손익분기점" },
    { to: "/delivery-fee", label: "배달앱 수수료" },
    { to: "/labor-cost", label: "인건비" },
    { to: "/car-expense", label: "업무용 차량 경비" },
    { to: "/meeting-cost", label: "회의 비용" },
    ],
  },
];

export const FOOTER_ALL_LINK: SiteFooterLink = {
  to: "/",
  label: "전체 계산기 보기 →",
};
