<script setup lang="ts">
// 차트 본체는 @shakilabs/ui ShMetricBars — 이 파일은 biz 레트로 패널 크롬만 입힌다.
// 호출부 5곳(뷰 4개 + IndividualCorpComparisonChart)의 props는 그대로 유지한다.
import { ShMetricBars } from "@shakilabs/ui";
import type { MetricBarGroup } from "@shakilabs/ui";

defineProps<{
  title: string;
  note: string;
  metrics: readonly MetricBarGroup[];
  formatValue: (value: number) => string;
}>();
</script>

<template>
  <section class="retro-panel overflow-hidden">
    <!-- 차트 루트가 본문 여백을 갖고, 타이틀바만 음수 마진으로 패널 폭까지 흘려 기존 크롬을 유지한다 -->
    <ShMetricBars
      class="px-4 pb-3 sm:px-5 sm:pb-4"
      :metrics="metrics"
      :note="note"
      :format-value="formatValue"
    >
      <template #header="{ titleId }">
        <!-- 문서 아웃라인 유지를 위해 h2, aria 계약상 titleId를 heading에 그대로 붙인다 -->
        <!-- mb는 header gap(0.25rem)과 합쳐 기존 retro-panel-content 상단 여백(py-3/sm:py-4)을 재현한다 -->
        <div class="retro-titlebar rounded-t-2xl -mx-4 mb-2 sm:-mx-5 sm:mb-3">
          <h2 :id="titleId" class="retro-title">{{ title }}</h2>
        </div>
      </template>
    </ShMetricBars>
  </section>
</template>
