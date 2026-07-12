<script setup lang="ts">
import { computed } from "vue";
import MetricComparisonBars from "@/components/result-visualization/MetricComparisonBars.vue";
import { formatWon } from "@/lib/utils";
import type { CorpResult, IndividualResult } from "@/utils/bizCalc";

const props = defineProps<{
  individual: IndividualResult;
  corp: CorpResult;
  betterOption: "개인" | "법인" | "동일";
}>();
const metrics = computed(() => [
  {
    key: "income",
    label: "세후소득",
    values: [
      { key: "individual", label: "개인사업자", value: props.individual.afterTaxIncome, highlight: props.betterOption === "개인" },
      { key: "corp", label: "법인", value: props.corp.afterTaxIncome, highlight: props.betterOption === "법인" },
    ],
  },
  {
    key: "tax",
    label: "총 세금·보험",
    values: [
      { key: "individual", label: "개인사업자", value: props.individual.totalTax },
      { key: "corp", label: "법인", value: props.corp.totalTax },
    ],
  },
]);
</script>

<template>
  <MetricComparisonBars
    title="개인사업자·법인 부담 비교"
    note="동일 매출과 경비율 기준이며 세후소득과 세금·보험 부담을 서로 다른 축으로 표시합니다."
    :metrics="metrics"
    :format-value="formatWon"
  />
</template>
