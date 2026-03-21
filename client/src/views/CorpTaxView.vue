<script setup lang="ts">
import { computed, ref } from "vue";
import FreshBadge from "@/components/common/FreshBadge.vue";
import SEOHead from "@/components/common/SEOHead.vue";
import { BIZ_SERVICE_UPDATED_AT } from "@/data/bizExpansionData";
import { formatPercent, formatWon, formatManWon } from "@/lib/utils";
import { calculateCorpTax } from "@/utils/bizExpansionCalc";

const props = defineProps<{ initialTaxableIncome?: number }>();
const amountLabel = computed(() => props.initialTaxableIncome ? formatManWon(props.initialTaxableIncome / 10000) : null);
const seoTitle = computed(() =>
  amountLabel.value
    ? `과세표준 ${amountLabel.value} 법인세 계산기 | shakilabs.com/biz`
    : "법인세 계산기 | 과세표준 기준 예상 세액",
);
const seoDescription = computed(() =>
  amountLabel.value
    ? `과세표준 ${amountLabel.value}원 기준 예상 법인세와 실효세율을 계산합니다.`
    : "법인 과세표준을 입력하면 누진세율 기준 예상 법인세와 실효세율을 계산합니다.",
);

const taxableIncome = ref(props.initialTaxableIncome ?? 500_000_000);
const result = computed(() => calculateCorpTax({ taxableIncome: taxableIncome.value }));
</script>

<template>
  <SEOHead :title="seoTitle" :description="seoDescription" />

  <div class="container space-y-5 py-5 max-w-4xl">
    <div class="retro-panel overflow-hidden">
      <div class="retro-titlebar rounded-t-2xl">
        <h1 class="retro-title">법인세 계산기</h1>
        <FreshBadge :message="`${BIZ_SERVICE_UPDATED_AT} 기준`" />
      </div>
      <div class="retro-panel-content space-y-4">
        <input v-model.number="taxableIncome" type="number" min="1000000" class="retro-input w-full" placeholder="과세표준" />
      </div>
    </div>

    <div class="grid gap-3 md:grid-cols-3">
      <div class="retro-panel-muted px-4 py-4">
        <p class="text-tiny text-muted-foreground">예상 법인세</p>
        <p class="mt-2 text-h2 font-bold text-primary">{{ formatWon(result.tax) }}</p>
      </div>
      <div class="retro-panel-muted px-4 py-4">
        <p class="text-tiny text-muted-foreground">세후 이익</p>
        <p class="mt-2 text-h2 font-bold text-foreground">{{ formatWon(result.afterTaxIncome) }}</p>
      </div>
      <div class="retro-panel-muted px-4 py-4">
        <p class="text-tiny text-muted-foreground">실효세율</p>
        <p class="mt-2 text-h2 font-bold text-foreground">{{ formatPercent(result.effectiveRate, 1) }}</p>
      </div>
    </div>

    <div class="retro-panel px-4 py-4 text-caption text-foreground">
      현재 과세 구간은 {{ result.bracketLabel }}이며 한계세율은 {{ formatPercent(result.marginalRate, 1) }}입니다.
    </div>
  </div>
</template>
