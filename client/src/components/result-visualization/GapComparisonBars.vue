<script setup lang="ts">
// 차트 본체는 @shakilabs/ui ShGapBars(1위 대비 차이 막대) — 이 파일은 biz 레트로 패널 크롬만 입힌다.
// 선택지 셋 이상을 한 지표로 고를 때, 값이 비슷해 0부터 그린 막대로는 차이가 안 보이면 이것을 쓴다.
import { ShGapBars } from "@shakilabs/ui";
import type { GapBarItem, GapDirection } from "@shakilabs/ui";

defineProps<{
  title: string;
  note: string;
  items: readonly GapBarItem[];
  formatValue: (value: number) => string;
  better: GapDirection;
}>();
</script>

<template>
  <section class="retro-panel overflow-hidden">
    <!-- MetricComparisonBars와 같은 크롬: 차트 루트가 본문 여백을 갖고 타이틀바만 음수 마진으로 패널 폭까지 -->
    <ShGapBars
      class="px-4 pb-3 sm:px-5 sm:pb-4"
      :items="items"
      :note="note"
      :format-value="formatValue"
      :better="better"
      highlight-tone="success"
    >
      <template #header="{ titleId }">
        <div class="retro-titlebar rounded-t-2xl -mx-4 mb-2 sm:-mx-5 sm:mb-3">
          <h2 :id="titleId" class="retro-title">{{ title }}</h2>
        </div>
      </template>
    </ShGapBars>
  </section>
</template>
