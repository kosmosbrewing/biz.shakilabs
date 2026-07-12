<script setup lang="ts">
import { computed, useId } from "vue";
import { normalizeSegments } from "@/utils/chartMath";

type Tone = "primary" | "fee" | "profit" | "muted";
type Segment = { key: string; label: string; value: number; tone: Tone };
const props = defineProps<{
  title: string;
  note: string;
  segments: readonly Segment[];
  formatValue: (value: number) => string;
}>();
const titleId = `biz-breakdown-${useId()}`;
const ratios = computed(() => normalizeSegments(props.segments.map((segment) => segment.value)));
const offsets = computed(() => ratios.value.map((_, index) => ratios.value.slice(0, index).reduce((sum, ratio) => sum + ratio, 0)));

function fillClass(tone: Tone): string {
  if (tone === "fee") return "fill-fee";
  if (tone === "profit") return "fill-profit";
  if (tone === "muted") return "fill-muted-foreground/45";
  return "fill-primary";
}
</script>

<template>
  <section class="retro-panel overflow-hidden" :aria-labelledby="titleId">
    <div class="retro-titlebar rounded-t-2xl">
      <h2 :id="titleId" class="retro-title">{{ title }}</h2>
    </div>
    <div class="retro-panel-content space-y-3">
      <p class="text-tiny leading-relaxed text-muted-foreground">{{ note }}</p>
      <svg viewBox="0 0 100 18" preserveAspectRatio="none" class="h-5 w-full overflow-hidden rounded-lg" role="img" :aria-labelledby="titleId">
        <rect v-for="(segment, index) in segments" :key="segment.key" :x="offsets[index] * 100" :width="ratios[index] * 100" height="18" :class="fillClass(segment.tone)" />
      </svg>
      <dl class="grid gap-2 sm:grid-cols-2">
        <div v-for="segment in segments" :key="`${segment.key}-legend`" class="flex justify-between gap-3 text-caption">
          <dt class="text-muted-foreground">{{ segment.label }}</dt>
          <dd class="font-semibold tabular-nums">{{ formatValue(segment.value) }}</dd>
        </div>
      </dl>
    </div>
  </section>
</template>
