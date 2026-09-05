<script setup lang="ts">
import { ref } from "vue";
import { mergeFaqs } from "@/lib/faqMerge";
import FreshBadge from "@/components/common/FreshBadge.vue";
import SEOHead from "@/components/common/SEOHead.vue";
import CalculatorInteractionTracker from "@/components/analytics/CalculatorInteractionTracker.vue";
import FaqAccordionPanel from "@/components/common/FaqAccordionPanel.vue";
import CalculatorPageHeader from "@/components/biz/CalculatorPageHeader.vue";
import BizResultHero from "@/components/biz/BizResultHero.vue";
import SeoRichGuide from "@/components/common/SeoRichGuide.vue";
import { BIZ_HOME_GUIDE } from "@/data/seoGuides";
import { withDigest } from "@/data/digests";
import { MEETING_DIGEST } from "@/data/digests/meetingDigest";
import { BIZ_SERVICE_UPDATED_AT } from "@/data/bizExpansionData";
import { formatWon } from "@/lib/utils";
import { calculateMeetingCost } from "@/utils/bizExpansionCalc";
import { useSafeCalculation } from "@/composables/useSafeCalculation";

const seoTitle = "회의 비용 계산기 | 인원·빈도 기준 연간 예산";
const seoDescription = "회의 참석 인원과 1인당 비용을 기준으로 월간·연간 회의 비용과 매입세액 가능액을 계산합니다.";

const faqItems = [
  {
    q: "회의 비용도 경비 처리가 되나요?",
    a: "사업과 관련된 회의비(식대·음료·장소대여 등)는 접대비가 아닌 복리후생비 또는 회의비로 경비 처리할 수 있습니다. 다만 1인당 금액이 과도하면 접대비로 재분류될 수 있으니 적정 수준을 유지해야 합니다.",
  },
  {
    q: "회의비와 접대비의 차이는 무엇인가요?",
    a: "회의비는 임직원 간 업무 목적 비용이고, 접대비는 거래처·외부인에 대한 비용입니다. 접대비는 매출 규모에 따라 한도가 있지만, 회의비는 한도 없이 전액 경비 처리됩니다.",
  },
  {
    q: "부가세 매입세액 공제는 어떻게 받나요?",
    a: "세금계산서 또는 신용카드 매출전표를 받으면 회의비에 포함된 부가세(10%)를 매입세액으로 공제받을 수 있습니다. 간이영수증은 공제 대상이 아닙니다.",
  },
] as const;

// 화면에 실제 렌더되는 병합 FAQ와 구조화 데이터를 일치시킨다 (스키마 규칙)
const mergedFaqs = mergeFaqs(faqItems, BIZ_HOME_GUIDE.faqs);
// 엔진 파생 다이제스트를 일반 가이드 섹션 앞에 싣는다 (페이지 고유 내용 우선)
const guideSections = withDigest(BIZ_HOME_GUIDE, MEETING_DIGEST);
const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: mergedFaqs.map((faq) => ({
    "@type": "Question",
    name: faq.q,
    acceptedAnswer: { "@type": "Answer", text: faq.a },
  })),
};

const attendees = ref(6);
const costPerPerson = ref(30_000);
const meetingsPerMonth = ref(4);
const months = ref(12);
const vatIncluded = ref(true);

const { result, validationError } = useSafeCalculation(
  () => calculateMeetingCost({
    attendees: attendees.value,
    costPerPerson: costPerPerson.value,
    meetingsPerMonth: meetingsPerMonth.value,
    months: months.value,
    vatIncluded: vatIncluded.value,
  }),
  calculateMeetingCost({ attendees: 6, costPerPerson: 30_000, meetingsPerMonth: 4, months: 12, vatIncluded: true }),
);
</script>

<template>
  <SEOHead :title="seoTitle" :description="seoDescription" :json-ld="faqJsonLd" />

  <div class="container space-y-5 py-5 max-w-4xl">
    <CalculatorPageHeader title="회의 비용 계산기" />

    <div class="retro-panel overflow-hidden">
      <div class="retro-titlebar rounded-t-2xl">
        <h2 class="retro-title">회의 조건 입력</h2>
        <FreshBadge :message="`${BIZ_SERVICE_UPDATED_AT} 기준`" />
      </div>
      <CalculatorInteractionTracker calculator-id="meeting_cost" page-path="/biz/meeting-cost">
      <div class="retro-panel-content grid gap-3 md:grid-cols-3" role="group" :aria-describedby="validationError ? 'meeting-cost-error' : undefined">
        <input v-model.number="attendees" aria-label="참석 인원" type="number" min="2" class="retro-input" placeholder="참석 인원" />
        <input v-model.number="costPerPerson" aria-label="1인당 비용" type="number" min="5000" class="retro-input" placeholder="1인당 비용" />
        <input v-model.number="meetingsPerMonth" aria-label="월 회의 횟수" type="number" min="1" class="retro-input" placeholder="월 회의 횟수" />
        <input v-model.number="months" aria-label="개월 수" type="number" min="1" max="12" class="retro-input" placeholder="개월 수" />
        <label class="retro-panel-muted flex items-center gap-2 px-3 py-3 text-caption font-semibold text-foreground md:col-span-2">
          <input v-model="vatIncluded" type="checkbox" class="h-4 w-4 rounded border-border" />
          부가세 포함 영수증 기준
        </label>
        <p v-if="validationError" id="meeting-cost-error" class="text-caption font-semibold text-destructive md:col-span-3" role="alert">
          {{ validationError }}
        </p>
      </div>
      </CalculatorInteractionTracker>
    </div>

    <BizResultHero label="연간 총예산" :value="formatWon(result.annualBudget)" />

    <div class="grid grid-cols-2 gap-3">
      <div class="retro-stat text-center">
        <p class="retro-stat-label">1회 회의 비용</p>
        <p class="retro-stat-value">{{ formatWon(result.perMeeting) }}</p>
      </div>
      <div class="retro-stat text-center">
        <p class="retro-stat-label">예상 매입세액</p>
        <p class="retro-stat-value">{{ formatWon(result.vatCredit) }}</p>
      </div>
    </div>

    <div class="retro-panel px-4 py-4 text-caption text-foreground">
      참석자 1인당 연간 부담액은 약 {{ formatWon(result.annualPerPerson) }}입니다.
    </div>

    <FaqAccordionPanel :items="mergedFaqs" />

    <SeoRichGuide
      :title="BIZ_HOME_GUIDE.title"
      :intro="BIZ_HOME_GUIDE.intro"
      :sections="guideSections"      :disclaimer="BIZ_HOME_GUIDE.disclaimer"
    />
  </div>
</template>
