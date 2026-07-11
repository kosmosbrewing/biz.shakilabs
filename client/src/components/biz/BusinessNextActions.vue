<script setup lang="ts">
import { onMounted } from "vue";
import { ArrowRight } from "lucide-vue-next";
import { ShSurface, ShText } from "@shakilabs/ui";
import { trackEvent } from "@/lib/analytics";

const actions = [
  { key: "corp_tax", title: "법인세 구간별 세액 계산", description: "전환 후 과세표준에 적용되는 법인세와 지방소득세를 확인합니다.", href: "/biz/corp-tax" },
  { key: "labor_cost", title: "대표·직원 인건비 총비용 계산", description: "급여 외 4대보험과 퇴직급여까지 포함한 사업주 부담을 봅니다.", href: "/biz/labor-cost" },
  { key: "vat_compare", title: "일반·간이과세 부가세 비교", description: "매출 구조에 따라 예상 부가세 부담이 어떻게 달라지는지 비교합니다.", href: "/biz/vat-compare" },
] as const;

onMounted(() => {
  actions.forEach((action) => trackEvent("related_tool_impression", {
    app_id: "biz", from_tool: "individual_vs_corp", to_tool: action.key, placement: "after_result",
  }));
});

function trackRelatedClick(toTool: string): void {
  trackEvent("related_tool_click", {
    app_id: "biz", from_tool: "individual_vs_corp", to_tool: toTool, placement: "after_result",
  });
}
</script>

<template>
  <section class="mb-6" aria-labelledby="business-next-actions-title">
    <ShText id="business-next-actions-title" as="h2" variant="heading" class="mb-3">
      사업자 형태 비교 후 실제 비용을 이어서 확인하세요
    </ShText>
    <div class="grid gap-3 md:grid-cols-3">
      <ShSurface
        v-for="action in actions"
        :key="action.key"
        as="a"
        :href="action.href"
        variant="outlined"
        padding="md"
        class="group flex flex-col no-underline hover:border-primary"
        @click="trackRelatedClick(action.key)"
      >
        <ShText as="h3" variant="heading">{{ action.title }}</ShText>
        <ShText variant="caption" tone="muted" class="mt-2 flex-1">{{ action.description }}</ShText>
        <span class="mt-4 inline-flex items-center gap-1 text-caption font-semibold text-primary">
          이어서 계산 <ArrowRight class="h-4 w-4" aria-hidden="true" />
        </span>
      </ShSurface>
    </div>
  </section>
</template>
