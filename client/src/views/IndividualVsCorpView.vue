<script setup lang="ts">
import { computed } from "vue";
import { ShPresetGroup, ShSlider } from "@shakilabs/ui";
import { User, Building2 } from "lucide-vue-next";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import SEOHead from "@/components/common/SEOHead.vue";
import BusinessSessionDraftControl from "@/components/biz/BusinessSessionDraftControl.vue";
import BusinessNextActions from "@/components/biz/BusinessNextActions.vue";
import SeoRichGuide from "@/components/common/SeoRichGuide.vue";
import IndividualCorpComparisonChart from "@/components/biz/IndividualCorpComparisonChart.vue";
import IndividualCorpNotes from "@/components/biz/IndividualCorpNotes.vue";
import { BIZ_INDIVIDUAL_VS_CORP_GUIDE } from "@/data/seoGuides";
import { INDIVIDUAL_VS_CORP_FAQS, INDIVIDUAL_VS_CORP_PRESETS } from "@/data/individualVsCorpContent";
import CalculatorInteractionTracker from "@/components/analytics/CalculatorInteractionTracker.vue";
import { useIndividualVsCorp } from "@/composables/useIndividualVsCorp";
import { formatWon, formatPercent, formatManWon } from "@/lib/utils";

const props = defineProps<{ initialRevenue?: number }>();
const amountLabel = computed(() => props.initialRevenue ? formatManWon(props.initialRevenue / 10000) : null);
const seoTitle = computed(() =>
  amountLabel.value
    ? `매출 ${amountLabel.value} 개인사업자 vs 법인 비교 | shakilabs.com/biz`
    : "개인사업자 vs 법인 세후소득 비교 | shakilabs.com/biz",
);
const seoDesc = computed(() =>
  amountLabel.value
    ? `연 매출 ${amountLabel.value}원 기준, 개인사업자와 법인 중 어느 쪽이 세후소득이 많은지 비교합니다.`
    : "동일 매출 기준, 개인사업자와 법인 중 어느 쪽이 세후소득이 많은지 비교해보세요.",
);

const {
  revenue,
  expenseRate,
  revenueDisplay,
  corpSalaryDisplay,
  individual,
  corp,
  difference,
  betterOption,
  draftLoaded,
  draftTracking,
  hasRestorableDraft,
  enableDraft,
  restoreDraft,
  clearDraft,
} = useIndividualVsCorp(props.initialRevenue);

const presets = INDIVIDUAL_VS_CORP_PRESETS;
const faqItems = INDIVIDUAL_VS_CORP_FAQS;

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
  <SEOHead
    :title="seoTitle"
    :description="seoDesc"
    :json-ld="faqJsonLd"
  />

  <div class="text-resize-layout container max-w-3xl py-6 sm:py-8">
    <h1 class="text-h1 font-bold text-foreground mb-1">개인사업자 vs 법인 세후소득</h1>
    <p class="text-caption text-muted-foreground mb-6">
      동일 매출·경비율 기준으로 세후 실수령을 비교합니다.
    </p>

    <BusinessSessionDraftControl
      class="mb-6"
      :loaded="draftLoaded"
      :tracking="draftTracking"
      :has-restorable-draft="hasRestorableDraft"
      @enable="enableDraft"
      @restore="restoreDraft"
      @clear="clearDraft"
    />

    <!-- 입력 섹션 -->
    <CalculatorInteractionTracker calculator-id="individual_vs_corp" page-path="/biz/individual-vs-corp">
      <div class="biz-input-panel retro-panel mb-6 space-y-4 p-4 sm:p-5">
        <div>
          <label for="biz-revenue" class="mb-1.5 block text-caption font-semibold text-foreground">연 매출액</label>
          <div class="relative">
            <input
              id="biz-revenue"
              v-model="revenueDisplay"
              type="text"
              inputmode="numeric"
              class="retro-input w-full pr-8"
            />
            <span class="absolute right-3 top-1/2 -translate-y-1/2 text-tiny text-muted-foreground">원</span>
          </div>
          <ShPresetGroup
            v-model="revenue"
            :options="presets"
            label="연 매출액 빠른 선택"
            class="mt-2"
          />
        </div>

        <div>
          <label for="biz-expense-rate" class="mb-1.5 block text-caption font-semibold text-foreground">
            경비율: {{ (expenseRate * 100).toFixed(0) }}%
          </label>
          <ShSlider
            id="biz-expense-rate"
            v-model="expenseRate"
            :min="0.1"
            :max="0.8"
            :step="0.05"
            :value-text="`경비율 ${(expenseRate * 100).toFixed(0)}%`"
            aria-label="경비율 슬라이더"
          />
          <div class="flex justify-between text-tiny text-muted-foreground">
            <span>10%</span>
            <span>80%</span>
          </div>
        </div>

        <div>
          <label for="biz-corp-salary" class="mb-1.5 block text-caption font-semibold text-foreground">법인 대표이사 연봉</label>
          <div class="relative">
            <input
              id="biz-corp-salary"
              v-model="corpSalaryDisplay"
              type="text"
              inputmode="numeric"
              class="retro-input w-full pr-8"
            />
            <span class="absolute right-3 top-1/2 -translate-y-1/2 text-tiny text-muted-foreground">원</span>
          </div>
        </div>
      </div>
    </CalculatorInteractionTracker>

    <!-- 결과 비교 -->
    <Card class="mb-6">
      <CardContent class="biz-result-panel p-4 sm:p-5">
        <div class="text-center mb-4">
          <Badge
            :variant="betterOption === '동일' ? 'secondary' : 'default'"
            :class="[
              'rounded-full px-3 py-1 text-caption',
              betterOption === '법인'
                ? 'bg-primary/15 text-primary border-transparent'
                : betterOption === '개인'
                  ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-transparent'
                  : '',
            ]"
          >
            {{ betterOption === '동일' ? '세후소득 동일' : `${betterOption}이 ${formatWon(Math.abs(difference))} 유리` }}
          </Badge>
        </div>

        <div class="biz-compare-grid grid grid-cols-2 gap-4">
          <!-- 개인사업자 -->
          <Card class="border-blue-200/50 dark:border-blue-800/50">
            <CardContent class="biz-compare-card space-y-2 p-4">
              <div class="flex items-center justify-center gap-2">
                <span class="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <User class="h-3.5 w-3.5" />
                </span>
                <h3 class="text-caption font-bold text-blue-600 dark:text-blue-400">개인사업자</h3>
              </div>
              <div class="text-center">
                <p class="text-h1 font-bold text-foreground tabular-nums">{{ formatWon(individual.afterTaxIncome) }}</p>
                <p class="text-tiny text-muted-foreground">세후소득</p>
              </div>
              <div class="biz-metrics space-y-1 text-tiny">
                <div class="flex justify-between">
                  <span class="text-muted-foreground">과세소득</span>
                  <span class="text-foreground">{{ formatWon(individual.taxableIncome) }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-muted-foreground">소득세</span>
                  <span class="text-destructive">{{ formatWon(individual.incomeTax) }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-muted-foreground">지방소득세</span>
                  <span class="text-destructive">{{ formatWon(individual.localTax) }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-muted-foreground">국민연금</span>
                  <span class="text-destructive">{{ formatWon(individual.nationalPension) }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-muted-foreground">건강+장기요양</span>
                  <span class="text-destructive">{{ formatWon(individual.healthInsurance + individual.longTermCare) }}</span>
                </div>
                <div class="flex justify-between border-t border-border pt-1 font-semibold">
                  <span class="text-muted-foreground">총 세금·보험</span>
                  <span class="text-destructive">{{ formatWon(individual.totalTax) }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-muted-foreground">실효세율</span>
                  <span class="text-foreground">{{ individual.taxableIncome > 0 ? formatPercent(individual.totalTax / individual.taxableIncome) : '-' }}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card class="border-primary/25">
            <CardContent class="biz-compare-card space-y-2 p-4">
              <div class="flex items-center justify-center gap-2">
                <span class="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Building2 class="h-3.5 w-3.5" />
                </span>
                <h3 class="text-caption font-bold text-primary">법인</h3>
              </div>
              <div class="text-center">
                <p class="text-h1 font-bold text-foreground tabular-nums">{{ formatWon(corp.afterTaxIncome) }}</p>
                <p class="text-tiny text-muted-foreground">세후소득</p>
              </div>
              <div class="biz-metrics space-y-1 text-tiny">
                <div class="flex justify-between">
                  <span class="text-muted-foreground">영업이익</span>
                  <span class="text-foreground">{{ formatWon(corp.operatingProfit) }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-muted-foreground">법인세</span>
                  <span class="text-destructive">{{ formatWon(corp.corpTax + corp.corpLocalTax) }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-muted-foreground">급여 소득세</span>
                  <span class="text-destructive">{{ formatWon(corp.salaryIncomeTax + corp.salaryLocalTax) }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-muted-foreground">4대보험</span>
                  <span class="text-destructive">{{ formatWon(corp.socialInsurance) }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-muted-foreground">배당소득세</span>
                  <span class="text-destructive">{{ formatWon(corp.dividendTax) }}</span>
                </div>
                <div class="flex justify-between border-t border-border pt-1 font-semibold">
                  <span class="text-muted-foreground">총 세금·보험</span>
                  <span class="text-destructive">{{ formatWon(corp.totalTax) }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-muted-foreground">실효세율</span>
                  <span class="text-foreground">{{ corp.operatingProfit > 0 ? formatPercent(corp.totalTax / corp.operatingProfit) : '-' }}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>

    <IndividualCorpComparisonChart :individual="individual" :corp="corp" :better-option="betterOption" />

    <BusinessNextActions />

    <IndividualCorpNotes :faqs="faqItems" :extra="BIZ_INDIVIDUAL_VS_CORP_GUIDE.faqs" />

    <SeoRichGuide
      :title="BIZ_INDIVIDUAL_VS_CORP_GUIDE.title"
      :intro="BIZ_INDIVIDUAL_VS_CORP_GUIDE.intro"
      :sections="BIZ_INDIVIDUAL_VS_CORP_GUIDE.sections"
      :checklist="BIZ_INDIVIDUAL_VS_CORP_GUIDE.checklist"
      :disclaimer="BIZ_INDIVIDUAL_VS_CORP_GUIDE.disclaimer"
    />
  </div>
</template>
