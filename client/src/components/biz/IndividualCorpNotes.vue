<script setup lang="ts">
import { AlertCircle } from "lucide-vue-next";
import { Card, CardContent } from "@/components/ui/card";
import FaqAccordionPanel from "@/components/common/FaqAccordionPanel.vue";

const props = defineProps<{
  faqs: ReadonlyArray<{ q: string; a: string }>;
  // SEO 가이드 FAQ — 중복 문항만 걸러 이 아코디언에 병합 노출한다
  extra?: ReadonlyArray<{ q: string; a: string }>;
}>();
</script>

<template>
  <Card class="border-border/60">
    <CardContent class="biz-note-panel p-4">
      <div class="mb-2 flex items-center gap-2">
        <span class="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <AlertCircle class="h-3.5 w-3.5" />
        </span>
        <p class="text-tiny font-semibold text-foreground">유의사항</p>
      </div>
      <ul class="list-disc space-y-0.5 pl-4 text-tiny text-muted-foreground">
        <li>개인사업자는 종합소득세, 법인은 법인세와 배당소득세 구조입니다.</li>
        <li>법인 설립비·기장료 등 간접비용과 추가 공제·감면은 별도입니다.</li>
      </ul>
    </CardContent>
  </Card>
  <FaqAccordionPanel :items="faqs" :extra="props.extra" />
</template>
