<script setup lang="ts">
import { computed, ref } from "vue";
import { mergeFaqs } from "@/lib/faqMerge";
import { ShBreakdownBar } from "@shakilabs/ui";
import FreshBadge from "@/components/common/FreshBadge.vue";
import SEOHead from "@/components/common/SEOHead.vue";
import FaqAccordionPanel from "@/components/common/FaqAccordionPanel.vue";
import CalculatorPageHeader from "@/components/biz/CalculatorPageHeader.vue";
import BizResultHero from "@/components/biz/BizResultHero.vue";
import SeoRichGuide from "@/components/common/SeoRichGuide.vue";
import { BIZ_HOME_GUIDE } from "@/data/seoGuides";
import { BIZ_SERVICE_UPDATED_AT } from "@/data/bizExpansionData";
import { formatPercent, formatWon } from "@/lib/utils";
import CalculatorInteractionTracker from "@/components/analytics/CalculatorInteractionTracker.vue";
import { calculateCarExpenseDeduction } from "@/utils/bizExpansionCalc";
import { useSafeCalculation } from "@/composables/useSafeCalculation";

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

// 화면에 실제 렌더되는 병합 FAQ와 구조화 데이터를 일치시킨다 (스키마 규칙)
const mergedFaqs = mergeFaqs(faqItems, BIZ_HOME_GUIDE.faqs);
const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: mergedFaqs.map((faq) => ({
    "@type": "Question",
    name: faq.q,
    acceptedAnswer: { "@type": "Answer", text: faq.a },
  })),
};

const annualCost = ref(12_000_000);
const businessUseRate = ref(0.8);
const taxRate = ref(0.24);
const { result, validationError } = useSafeCalculation(
  () => calculateCarExpenseDeduction({
    annualCost: annualCost.value,
    businessUseRate: businessUseRate.value,
    taxRate: taxRate.value,
  }),
  calculateCarExpenseDeduction({ annualCost: 12_000_000, businessUseRate: 0.8, taxRate: 0.24 }),
);

const expenseSegments = computed(() => [
  { key: "deductible", label: "손금 인정액", value: result.value.deductibleAmount, tone: "primary" as const },
  { key: "private", label: "사적 사용분", value: result.value.nonDeductibleAmount, tone: "danger" as const },
]);
</script>

<template>
  <SEOHead :title="seoTitle" :description="seoDescription" :json-ld="faqJsonLd" />

  <div class="container space-y-5 py-5 max-w-4xl">
    <CalculatorPageHeader title="업무용 차량 경비 계산기" />

    <div class="retro-panel overflow-hidden">
      <div class="retro-titlebar rounded-t-2xl">
        <h2 class="retro-title">차량비 조건 입력</h2>
        <FreshBadge :message="`${BIZ_SERVICE_UPDATED_AT} 기준`" />
      </div>
      <CalculatorInteractionTracker calculator-id="car_expense" page-path="/biz/car-expense">
        <div class="retro-panel-content grid gap-3 md:grid-cols-3" role="group" :aria-describedby="validationError ? 'car-expense-error' : undefined">
          <input v-model.number="annualCost" aria-label="연간 차량비" type="number" min="100000" class="retro-input" placeholder="연간 차량비" />
          <input v-model.number="businessUseRate" aria-label="업무 사용비율" type="number" min="0.1" max="1" step="0.05" class="retro-input" placeholder="업무 사용비율" />
          <input v-model.number="taxRate" aria-label="법인세율" type="number" min="0.06" max="0.5" step="0.01" class="retro-input" placeholder="법인세율" />
          <p v-if="validationError" id="car-expense-error" class="text-caption font-semibold text-destructive md:col-span-3" role="alert">
            {{ validationError }}
          </p>
        </div>
      </CalculatorInteractionTracker>
    </div>

    <BizResultHero label="손금 인정액" :value="formatWon(result.deductibleAmount)" />

    <div class="grid grid-cols-2 gap-3">
      <div class="retro-stat text-center">
        <p class="retro-stat-label">사적 사용분</p>
        <p class="retro-stat-value">{{ formatWon(result.nonDeductibleAmount) }}</p>
      </div>
      <div class="retro-stat text-center">
        <p class="retro-stat-label">예상 절세 효과</p>
        <p class="retro-stat-value">{{ formatWon(result.taxSaving) }}</p>
      </div>
    </div>

    <ShBreakdownBar
      label="연간 차량비 경비 인정 구성"
      note="입력한 업무 사용비율에 따라 연간 차량비를 손금 인정액과 사적 사용분으로 나눴습니다."
      :segments="expenseSegments"
      :format-value="formatWon"
      surface="outlined"
    />

    <div class="retro-panel px-4 py-4 text-caption text-foreground">
      업무 사용비율 {{ formatPercent(businessUseRate, 0) }} 기준입니다. {{ result.logbookAdvice }}.
    </div>

    <FaqAccordionPanel :items="mergedFaqs" />

    <SeoRichGuide
      :title="BIZ_HOME_GUIDE.title"
      :intro="BIZ_HOME_GUIDE.intro"
      :sections="BIZ_HOME_GUIDE.sections"      :disclaimer="BIZ_HOME_GUIDE.disclaimer"
    />
  </div>
</template>
