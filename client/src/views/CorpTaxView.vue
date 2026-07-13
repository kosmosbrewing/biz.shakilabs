<script setup lang="ts">
import { computed, ref } from "vue";
import FreshBadge from "@/components/common/FreshBadge.vue";
import SEOHead from "@/components/common/SEOHead.vue";
import FaqAccordionPanel from "@/components/common/FaqAccordionPanel.vue";
import CalculatorPageHeader from "@/components/biz/CalculatorPageHeader.vue";
import SeoRichGuide from "@/components/common/SeoRichGuide.vue";
import BreakdownStackedBar from "@/components/result-visualization/BreakdownStackedBar.vue";
import { BIZ_CORP_TAX_GUIDE } from "@/data/seoGuides";
import { BIZ_SERVICE_UPDATED_AT, CORP_TAX_SOURCE_URL } from "@/data/bizExpansionData";
import { formatPercent, formatWon, formatManWon } from "@/lib/utils";
import { calculateCorpTax } from "@/utils/bizExpansionCalc";
import { useSafeCalculation } from "@/composables/useSafeCalculation";

const props = defineProps<{ initialTaxableIncome?: number }>();
const amountLabel = computed(() => props.initialTaxableIncome ? formatManWon(props.initialTaxableIncome / 10000) : null);
const seoTitle = computed(() =>
  amountLabel.value
    ? `과세표준 ${amountLabel.value} 법인세 계산기 | shakilabs.com/biz`
    : "법인세 계산기 | 과세표준 기준 예상 세액",
);
const seoDescription = computed(() =>
  amountLabel.value
    ? `과세표준 ${amountLabel.value}원 기준 예상 법인세·지방소득세와 실효세율을 계산합니다.`
    : "법인 과세표준을 입력하면 누진세율 기준 예상 법인세·지방소득세와 실효세율을 계산합니다.",
);

const taxableIncome = ref(props.initialTaxableIncome ?? 500_000_000);
const { result, validationError } = useSafeCalculation(
  () => calculateCorpTax({ taxableIncome: taxableIncome.value }),
  calculateCorpTax({ taxableIncome: 500_000_000 }),
);
const incomeSegments = computed(() => [
  { key: "after-tax", label: "세후 이익", value: result.value.afterTaxIncome, tone: "profit" as const },
  { key: "tax", label: "법인세", value: result.value.tax, tone: "fee" as const },
]);

const faqItems = [
  {
    q: "2026년 법인세율 구간은 어떻게 되나요?",
    a: "2026년 1월 1일 이후 개시하는 사업연도는 과세표준 2억 이하 10%, 2억~200억 20%, 200억~3,000억 22%, 3,000억 초과 25%의 4단계 누진세율이 적용됩니다.",
  },
  {
    q: "법인세 실효세율과 한계세율의 차이는 무엇인가요?",
    a: "한계세율은 추가 1원에 적용되는 세율이고, 실효세율은 전체 과세표준 대비 실제 납부 세액의 비율입니다. 누진세 구조이므로 실효세율은 한계세율보다 항상 낮습니다.",
  },
  {
    q: "법인세 외에 추가로 내야 하는 세금이 있나요?",
    a: "계산 결과에는 법인세의 10%인 지방법인소득세가 포함됩니다. 이익을 배당하면 배당소득세 등은 별도로 발생할 수 있습니다.",
  },
] as const;

const faqJsonLd = computed(() => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqItems.map((faq) => ({
    "@type": "Question",
    name: faq.q,
    acceptedAnswer: { "@type": "Answer", text: faq.a },
  })),
}));
</script>

<template>
  <SEOHead :title="seoTitle" :description="seoDescription" :json-ld="faqJsonLd" />

  <div class="container space-y-5 py-5 max-w-4xl">
    <CalculatorPageHeader title="법인세 계산기" />

    <div class="retro-panel overflow-hidden">
      <div class="retro-titlebar rounded-t-2xl">
        <h2 class="retro-title">과세표준 입력</h2>
        <FreshBadge :message="`${BIZ_SERVICE_UPDATED_AT} 기준`" />
      </div>
      <div class="retro-panel-content space-y-4" role="group" :aria-describedby="validationError ? 'corp-tax-error' : undefined">
        <input v-model.number="taxableIncome" aria-label="과세표준" type="number" min="1000000" class="retro-input w-full" placeholder="과세표준" />
        <p v-if="validationError" id="corp-tax-error" class="text-caption font-semibold text-destructive" role="alert">
          {{ validationError }}
        </p>
      </div>
    </div>

    <div class="grid gap-3 md:grid-cols-3">
      <div class="retro-panel-muted px-4 py-4">
        <p class="text-tiny text-muted-foreground">법인세 + 지방소득세</p>
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

    <BreakdownStackedBar
      title="과세표준의 세금·세후 이익 구성"
      note="입력한 과세표준에서 예상 법인세를 제외한 금액을 한 막대에 표시합니다."
      :segments="incomeSegments"
      :format-value="formatWon"
    />

    <div class="retro-panel px-4 py-4 text-caption text-foreground space-y-1">
      <p>현재 과세 구간은 {{ result.bracketLabel }}이며 지방소득세 포함 한계세율은 {{ formatPercent(result.marginalRate, 1) }}입니다.</p>
      <p class="text-muted-foreground">
        공식 근거:
        <a :href="CORP_TAX_SOURCE_URL" target="_blank" rel="noopener noreferrer" class="retro-link">국세청 법인세 세율</a>
      </p>
    </div>

    <FaqAccordionPanel :items="faqItems" />

    <SeoRichGuide
      :title="BIZ_CORP_TAX_GUIDE.title"
      :intro="BIZ_CORP_TAX_GUIDE.intro"
      :sections="BIZ_CORP_TAX_GUIDE.sections"
      :faqs="BIZ_CORP_TAX_GUIDE.faqs"
      :disclaimer="BIZ_CORP_TAX_GUIDE.disclaimer"
    />
  </div>
</template>
