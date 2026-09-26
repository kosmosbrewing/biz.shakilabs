<script setup lang="ts">
import { onMounted } from "vue";
import { RouterLink } from "vue-router";
import { ShNextActions, type NextActionItem } from "@shakilabs/ui";
import { trackEvent } from "@/lib/analytics";

// 공통 블록(ShNextActions)은 카드 전체가 링크라 소개 제목·카드별 설명 문장·"이어서 계산" 줄이 필요 없다
// (사용자 피드백 "텍스트가 너무 많다"). 반폭 칸이면 목록으로 스스로 바뀌어 격자 클래스도 달지 않는다.
// key는 분석 이벤트 to_tool 값이라 바꾸지 않는다. to는 라우터 경로 — base(/biz/)가 붙어 이전과 같은 /biz/corp-tax 등.
// 제목은 도착 계산기 이름(bizNavigation 탭 이름, 인건비는 탭에 없어 같은 규칙으로 "인건비 계산기"에서).
// 인건비 계산기에는 대표 항목이 없고 직원 월급·직원 수를 근로자 기준(고용·산재보험·퇴직급여 1/12)으로 매긴다
// — 옛 제목 "대표·직원 인건비"의 "대표"는 사실과 달라 뺐다.
const actions: readonly NextActionItem[] = [
  { key: "corp_tax", title: "법인세 계산", note: "과세표준 기준 · 지방소득세 포함", to: "/corp-tax" },
  { key: "labor_cost", title: "인건비 계산", note: "직원 4대보험·퇴직급여 사업주 부담", to: "/labor-cost" },
  { key: "vat_compare", title: "부가세 비교", note: "간이 vs 일반과세 · 매출·업종 기준", to: "/vat-compare" },
];

onMounted(() => {
  actions.forEach((action) => trackEvent("related_tool_impression", {
    app_id: "biz", from_tool: "individual_vs_corp", to_tool: action.key, placement: "after_result",
  }));
});

function trackRelatedClick(item: NextActionItem): void {
  trackEvent("related_tool_click", {
    app_id: "biz", from_tool: "individual_vs_corp", to_tool: item.key, placement: "after_result",
  });
}
</script>

<template>
  <ShNextActions :items="actions" :link-component="RouterLink" @select="trackRelatedClick" />
</template>
