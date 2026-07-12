<script setup lang="ts">
import { computed, useId } from "vue";
import { positiveBarWidth } from "@/utils/chartMath";

type ValueItem = { key: string; label: string; value: number; highlight?: boolean; detail?: string };
type Metric = { key: string; label: string; values: readonly ValueItem[] };
const props = defineProps<{
  title: string;
  note: string;
  metrics: readonly Metric[];
  formatValue: (value: number) => string;
}>();
const titleId = `biz-metrics-${useId()}`;
const maxima = computed(() => new Map(props.metrics.map((metric) => [
  metric.key,
  Math.max(...metric.values.map((item) => item.value), 0),
])));
</script>

<template>
  <section class="retro-panel overflow-hidden" :aria-labelledby="titleId">
    <div class="retro-titlebar rounded-t-2xl">
      <h2 :id="titleId" class="retro-title">{{ title }}</h2>
    </div>
    <div class="retro-panel-content space-y-5">
      <p class="text-tiny leading-relaxed text-muted-foreground">{{ note }}</p>
      <div v-for="metric in metrics" :key="metric.key" class="space-y-3">
        <h3 class="border-b border-border/50 pb-1.5 text-tiny font-semibold text-muted-foreground">{{ metric.label }}</h3>
        <div v-for="item in metric.values" :key="item.key" class="space-y-1.5">
          <div class="flex items-baseline justify-between gap-3 text-caption">
            <span class="font-semibold" :class="item.highlight ? 'text-primary' : 'text-foreground'">{{ item.label }}</span>
            <strong class="tabular-nums" :class="item.highlight ? 'text-primary' : 'text-foreground'">{{ formatValue(item.value) }}</strong>
          </div>
          <div class="h-3 overflow-hidden rounded-full bg-muted/55">
            <svg viewBox="0 0 100 12" preserveAspectRatio="none" class="block h-full w-full" aria-hidden="true">
              <rect :width="positiveBarWidth(item.value, maxima.get(metric.key) ?? 0)" height="12" rx="4" :class="item.highlight ? 'fill-primary' : 'fill-muted-foreground/45'" />
            </svg>
          </div>
          <p v-if="item.detail" class="text-tiny text-muted-foreground">{{ item.detail }}</p>
        </div>
      </div>
    </div>
  </section>
</template>
