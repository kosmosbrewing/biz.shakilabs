<script setup lang="ts">
import { computed, ref, useId } from "vue";
import { mergeFaqs } from "@/lib/faqMerge";
import { ShBreakdownBar, ShCalculatorSplit } from "@shakilabs/ui";
import FreshBadge from "@/components/common/FreshBadge.vue";
import SEOHead from "@/components/common/SEOHead.vue";
import FaqAccordionPanel from "@/components/common/FaqAccordionPanel.vue";
import CalculatorPageHeader from "@/components/biz/CalculatorPageHeader.vue";
import BizResultHero from "@/components/biz/BizResultHero.vue";
import SeoRichGuide from "@/components/common/SeoRichGuide.vue";
import { BIZ_HOME_GUIDE } from "@/data/seoGuides";
import { withDigest } from "@/data/digests";
import { CAR_DIGEST } from "@/data/digests/carDigest";
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
// 엔진 파생 다이제스트를 일반 가이드 섹션 앞에 싣는다 (페이지 고유 내용 우선)
const guideSections = withDigest(BIZ_HOME_GUIDE, CAR_DIGEST);
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
// 비율은 화면에서 %(80·24)로 받는다 — 소수(0.8·0.24) 칸은 값만 봐서는 단위를 알 수 없다.
// 계산 함수·테스트·다이제스트는 소수 규약 그대로라 넘길 때만 /100 한다(URL·저장 입력 없음).
const businessUsePercent = ref(80);
const taxPercent = ref(24);
const businessUseRate = computed(() => businessUsePercent.value / 100);
const taxRate = computed(() => taxPercent.value / 100);
const annualCostId = useId();
const businessUseId = useId();
const taxRateId = useId();
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

  <div class="sh-container sh-container--tool space-y-5 py-5">
    <CalculatorPageHeader title="업무용 차량 경비 계산기" />

    <ShCalculatorSplit>
      <template #input>
        <div class="retro-panel overflow-hidden">
          <div class="retro-titlebar rounded-t-2xl">
            <h2 class="retro-title">차량비 조건 입력</h2>
            <FreshBadge :message="`${BIZ_SERVICE_UPDATED_AT} 기준`" />
          </div>
          <CalculatorInteractionTracker calculator-id="car_expense" page-path="/biz/car-expense">
            <!-- 반폭 칸(약 500px)에서 3열이면 칸이 159px에 라벨도 없어 값만 보였다 — 금액은 한 줄, 비율 둘은 짧은 숫자 쌍이라 2열 -->
            <div class="retro-panel-content grid gap-3 sm:grid-cols-2" role="group" :aria-describedby="validationError ? 'car-expense-error' : undefined">
              <div class="sm:col-span-2">
                <label :for="annualCostId" class="mb-1.5 block text-caption font-semibold text-foreground">연간 차량비</label>
                <div class="relative">
                  <input :id="annualCostId" v-model.number="annualCost" type="number" min="100000" class="retro-input pr-8" placeholder="연간 차량비" />
                  <span class="absolute right-3 top-1/2 -translate-y-1/2 text-tiny text-muted-foreground">원</span>
                </div>
              </div>
              <div>
                <label :for="businessUseId" class="mb-1.5 block text-caption font-semibold text-foreground">업무 사용비율</label>
                <div class="relative">
                  <input :id="businessUseId" v-model.number="businessUsePercent" type="number" min="10" max="100" step="5" class="retro-input pr-8" placeholder="업무 사용비율" />
                  <span class="absolute right-3 top-1/2 -translate-y-1/2 text-tiny text-muted-foreground">%</span>
                </div>
              </div>
              <div>
                <label :for="taxRateId" class="mb-1.5 block text-caption font-semibold text-foreground">법인세율</label>
                <div class="relative">
                  <input :id="taxRateId" v-model.number="taxPercent" type="number" min="6" max="50" step="1" class="retro-input pr-8" placeholder="법인세율" />
                  <span class="absolute right-3 top-1/2 -translate-y-1/2 text-tiny text-muted-foreground">%</span>
                </div>
              </div>
              <p v-if="validationError" id="car-expense-error" class="text-caption font-semibold text-destructive sm:col-span-2" role="alert">
                {{ validationError }}
              </p>
            </div>
          </CalculatorInteractionTracker>
        </div>
      </template>

      <template #result>
        <section class="retro-panel overflow-hidden" aria-labelledby="car-expense-result-title">
          <div class="retro-titlebar rounded-t-2xl">
            <h2 id="car-expense-result-title" class="retro-title">차량비 계산 결과</h2>
          </div>
          <div class="retro-panel-content space-y-4">
            <BizResultHero flat label="손금 인정액" :value="formatWon(result.deductibleAmount)" />

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
          </div>
        </section>
      </template>
    </ShCalculatorSplit>

    <!-- 차트·안내문은 결과 칸(반폭)에 두면 1440px 실측에서 결과가 입력보다 317px 길어져
         왼쪽 칸이 빈다 — 1×2 아래 전폭으로 내리고 결과 칸엔 요약(히어로+통계)만 남긴다. -->
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
      :sections="guideSections"      :disclaimer="BIZ_HOME_GUIDE.disclaimer"
    />
  </div>
</template>
