<script setup lang="ts">
import { computed, ref } from "vue";
import FreshBadge from "@/components/common/FreshBadge.vue";
import SEOHead from "@/components/common/SEOHead.vue";
import SeoRichGuide from "@/components/common/SeoRichGuide.vue";
import { BIZ_HOME_GUIDE } from "@/data/seoGuides";
import { BIZ_SERVICE_UPDATED_AT } from "@/data/bizExpansionData";
import { formatPercent, formatWon } from "@/lib/utils";
import { calculateCarExpenseDeduction } from "@/utils/bizExpansionCalc";

const seoTitle = "업무용 차량 경비 처리 계산기 | 업무 사용비율 기준 손금";
const seoDescription = "업무용 차량 관련 비용과 업무 사용비율을 넣으면 손금 인정액과 절세 효과를 계산합니다.";

const faqItems = [
  {
    q: "업무용 차량 경비 처리의 한도는 얼마인가요?",
    a: "차량 관련 비용(감가상각비·보험료·유류비 등) 중 연간 1,500만원까지 손금 인정됩니다. 1,500만원을 초과하면 운행일지를 작성해야 업무 사용분을 추가 인정받을 수 있습니다.",
  },
  {
    q: "운행일지를 작성하지 않으면 어떻게 되나요?",
    a: "연간 차량 비용이 1,500만원 이하라면 운행일지 없이도 전액 손금 처리됩니다. 초과분에 대해서는 운행일지가 없으면 업무 사용비율을 입증할 수 없어 손금 부인될 수 있습니다.",
  },
  {
    q: "리스·렌트 차량도 경비 처리가 되나요?",
    a: "리스료·렌트료도 업무 사용비율에 따라 손금 처리됩니다. 다만 리스는 연 800만원, 렌트는 연 800만원의 감가상각비 한도가 있습니다.",
  },
] as const;

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqItems.map((faq) => ({
    "@type": "Question",
    name: faq.q,
    acceptedAnswer: { "@type": "Answer", text: faq.a },
  })),
};

const annualCost = ref(12_000_000);
const businessUseRate = ref(0.8);
const taxRate = ref(0.24);
const result = computed(() => calculateCarExpenseDeduction({
  annualCost: annualCost.value,
  businessUseRate: businessUseRate.value,
  taxRate: taxRate.value,
}));
</script>

<template>
  <SEOHead :title="seoTitle" :description="seoDescription" :json-ld="faqJsonLd" />

  <div class="container space-y-5 py-5 max-w-4xl">
    <div class="retro-panel overflow-hidden">
      <div class="retro-titlebar rounded-t-2xl">
        <h1 class="retro-title">업무용 차량 경비 처리</h1>
        <FreshBadge :message="`${BIZ_SERVICE_UPDATED_AT} 기준`" />
      </div>
      <div class="retro-panel-content grid gap-3 md:grid-cols-3">
        <input v-model.number="annualCost" type="number" min="100000" class="retro-input" placeholder="연간 차량비" />
        <input v-model.number="businessUseRate" type="number" min="0.1" max="1" step="0.05" class="retro-input" placeholder="업무 사용비율" />
        <input v-model.number="taxRate" type="number" min="0.06" max="0.5" step="0.01" class="retro-input" placeholder="법인세율" />
      </div>
    </div>

    <div class="grid gap-3 md:grid-cols-3">
      <div class="retro-panel-muted px-4 py-4">
        <p class="text-tiny text-muted-foreground">손금 인정액</p>
        <p class="mt-2 text-h2 font-bold text-primary">{{ formatWon(result.deductibleAmount) }}</p>
      </div>
      <div class="retro-panel-muted px-4 py-4">
        <p class="text-tiny text-muted-foreground">사적 사용분</p>
        <p class="mt-2 text-h2 font-bold text-foreground">{{ formatWon(result.nonDeductibleAmount) }}</p>
      </div>
      <div class="retro-panel-muted px-4 py-4">
        <p class="text-tiny text-muted-foreground">예상 절세 효과</p>
        <p class="mt-2 text-h2 font-bold text-foreground">{{ formatWon(result.taxSaving) }}</p>
      </div>
    </div>

    <div class="retro-panel px-4 py-4 text-caption text-foreground">
      업무 사용비율 {{ formatPercent(businessUseRate, 0) }} 기준입니다. {{ result.logbookAdvice }}.
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
      :title="BIZ_HOME_GUIDE.title"
      :intro="BIZ_HOME_GUIDE.intro"
      :sections="BIZ_HOME_GUIDE.sections"
      :faqs="BIZ_HOME_GUIDE.faqs"
      :disclaimer="BIZ_HOME_GUIDE.disclaimer"
    />
  </div>
</template>
