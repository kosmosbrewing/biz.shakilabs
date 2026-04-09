<script setup lang="ts">
import { computed, ref } from "vue";
import FreshBadge from "@/components/common/FreshBadge.vue";
import SEOHead from "@/components/common/SEOHead.vue";
import SeoRichGuide from "@/components/common/SeoRichGuide.vue";
import { BIZ_CORP_TAX_GUIDE } from "@/data/seoGuides";
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

const faqItems = [
  {
    q: "2026년 법인세율 구간은 어떻게 되나요?",
    a: "과세표준 2억 이하 9%, 2억~200억 19%, 200억~3,000억 21%, 3,000억 초과 24%의 4단계 누진세율이 적용됩니다.",
  },
  {
    q: "법인세 실효세율과 한계세율의 차이는 무엇인가요?",
    a: "한계세율은 추가 1원에 적용되는 세율이고, 실효세율은 전체 과세표준 대비 실제 납부 세액의 비율입니다. 누진세 구조이므로 실효세율은 한계세율보다 항상 낮습니다.",
  },
  {
    q: "법인세 외에 추가로 내야 하는 세금이 있나요?",
    a: "법인세의 10%에 해당하는 지방소득세를 추가로 납부해야 합니다. 또한 이익을 배당할 경우 배당소득세(15.4%)가 별도로 부과됩니다.",
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

    <div class="retro-panel overflow-hidden">
      <div class="retro-titlebar rounded-t-2xl">
        <h2 class="retro-title">자주 묻는 질문</h2>
      </div>
      <div class="retro-panel-content space-y-3">
        <details v-for="faq in faqItems" :key="faq.q" class="retro-panel-muted p-4">
          <summary class="cursor-pointer list-none text-body font-semibold text-foreground">{{ faq.q }}</summary>
          <p class="mt-2 text-caption leading-relaxed text-muted-foreground">{{ faq.a }}</p>
        </details>
      </div>
    </div>

    <SeoRichGuide
      :title="BIZ_CORP_TAX_GUIDE.title"
      :intro="BIZ_CORP_TAX_GUIDE.intro"
      :sections="BIZ_CORP_TAX_GUIDE.sections"
      :faqs="BIZ_CORP_TAX_GUIDE.faqs"
      :disclaimer="BIZ_CORP_TAX_GUIDE.disclaimer"
    />
  </div>
</template>
