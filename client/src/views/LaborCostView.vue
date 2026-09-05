<script setup lang="ts">
import { computed, ref } from "vue";
import { mergeFaqs } from "@/lib/faqMerge";
import { ShBreakdownBar, ShPresetGroup } from "@shakilabs/ui";
import FreshBadge from "@/components/common/FreshBadge.vue";
import SEOHead from "@/components/common/SEOHead.vue";
import FaqAccordionPanel from "@/components/common/FaqAccordionPanel.vue";
import CalculatorPageHeader from "@/components/biz/CalculatorPageHeader.vue";
import BizResultHero from "@/components/biz/BizResultHero.vue";
import SeoRichGuide from "@/components/common/SeoRichGuide.vue";
import MetricComparisonBars from "@/components/result-visualization/MetricComparisonBars.vue";
import { BIZ_LABOR_COST_GUIDE } from "@/data/seoGuides";
import { withDigest } from "@/data/digests";
import { LABOR_DIGEST } from "@/data/digests/laborDigest";
import {
  INDUSTRY_ACCIDENT_RATES,
  LABOR_COST_FAQS,
  LABOR_COST_SALARY_PRESETS,
  LABOR_COST_UPDATED,
  MINIMUM_WAGE_SOURCE_URL,
  NATIONAL_PENSION_SOURCE_URL,
} from "@/data/laborCost";
import { formatManWon, formatPercent, formatWon } from "@/lib/utils";
import CalculatorInteractionTracker from "@/components/analytics/CalculatorInteractionTracker.vue";
import { calculateLaborCost } from "@/utils/laborCostCalc";
import { useSafeCalculation } from "@/composables/useSafeCalculation";

const props = defineProps<{ initialSalary?: number }>();

const monthlySalary = ref(props.initialSalary ?? 3_000_000);
const employeeCount = ref(1);
const industryKey = ref("office");
const includeRetirement = ref(true);

const { result, validationError } = useSafeCalculation(
  () => calculateLaborCost({
    monthlySalary: monthlySalary.value,
    employeeCount: employeeCount.value,
    industryKey: industryKey.value,
    includeRetirement: includeRetirement.value,
  }),
  calculateLaborCost({ monthlySalary: 3_000_000, employeeCount: 1, industryKey: "office", includeRetirement: true }),
);

const amountLabel = computed(() => (props.initialSalary ? formatManWon(props.initialSalary / 10000) : null));
const seoTitle = computed(() =>
  amountLabel.value
    ? `월급 ${amountLabel.value} 인건비 계산기 | 4대보험 사업주 부담`
    : "인건비 계산기 — 4대보험·퇴직금 포함 실제 고용비용 계산",
);
const seoDescription = computed(() =>
  amountLabel.value
    ? `월급 ${amountLabel.value}원 기준 사업주 부담 4대보험료, 퇴직급여 적립분, 실제 인건비를 계산합니다.`
    : "월급을 입력하면 사업주 부담 4대보험, 퇴직급여, 총 인건비와 근로자 실수령액을 한눈에 확인합니다.",
);
// 금액 변형(/labor-cost/:amount)은 기본 계산기와 동일한 본문을 프리렌더하므로
// 중복으로 경쟁하는 대신 기본 페이지로 canonical을 모은다.
const canonicalPath = computed(() => (props.initialSalary ? "/labor-cost" : undefined));

// 화면에 실제 렌더되는 병합 FAQ와 구조화 데이터를 일치시킨다 (스키마 규칙)
const mergedFaqs = mergeFaqs(LABOR_COST_FAQS, BIZ_LABOR_COST_GUIDE.faqs);
// 엔진 파생 다이제스트를 일반 가이드 섹션 앞에 싣는다 (페이지 고유 내용 우선)
const guideSections = withDigest(BIZ_LABOR_COST_GUIDE, LABOR_DIGEST);
const faqJsonLd = computed(() => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: mergedFaqs.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
}));

const costSegments = computed(() => [
  { key: "salary", label: "세전 급여", value: result.value.monthlySalary, tone: "primary" as const },
  { key: "insurance", label: "사업주 4대보험", value: result.value.employer.totalInsurance, tone: "danger" as const },
  { key: "retirement", label: "퇴직급여 적립", value: result.value.retirementReserve, tone: "muted" as const },
]);

const insuranceMetrics = computed(() => [{
  key: "insurance",
  label: "월 4대보험 부담",
  values: [
    { key: "employer", label: "사업주", value: result.value.employer.totalInsurance, highlight: true },
    { key: "employee", label: "근로자", value: result.value.employee.totalInsurance },
  ],
}]);
</script>

<template>
  <SEOHead
    :title="seoTitle"
    :description="seoDescription"
    :canonical-path="canonicalPath"
    :json-ld="faqJsonLd"
  />

  <div class="container space-y-5 py-5 max-w-4xl">
    <CalculatorPageHeader title="인건비 계산기" />

    <!-- 헤더 -->
    <div class="retro-panel overflow-hidden">
      <div class="retro-titlebar rounded-t-2xl">
        <h2 class="retro-title">계산 기준 안내</h2>
        <FreshBadge :message="`${LABOR_COST_UPDATED} 기준`" />
      </div>
      <div class="retro-panel-content space-y-2">
        <p class="text-body text-muted-foreground">월급을 입력하면 사업주 부담 4대보험, 퇴직급여, 총 인건비를 계산합니다.</p>
      </div>
    </div>

    <CalculatorInteractionTracker calculator-id="labor_cost" page-path="/biz/labor-cost">
      <div class="retro-panel p-4 sm:p-5 space-y-4" role="group" :aria-describedby="validationError ? 'labor-cost-error' : undefined">
        <div class="space-y-1">
          <label class="text-tiny font-medium text-muted-foreground">월 급여 (세전)</label>
          <input v-model.number="monthlySalary" aria-label="월 급여" type="number" min="100000" class="retro-input w-full" />
          <ShPresetGroup
            v-model="monthlySalary"
            :options="LABOR_COST_SALARY_PRESETS"
            label="월 급여 빠른 선택"
          />
        </div>

        <div class="grid gap-3 sm:grid-cols-3">
          <div class="space-y-1">
            <label class="text-tiny font-medium text-muted-foreground">직원 수</label>
            <input v-model.number="employeeCount" aria-label="직원 수" type="number" min="1" max="10000" class="retro-input w-full" />
          </div>
          <div class="space-y-1">
            <label class="text-tiny font-medium text-muted-foreground">업종 (산재보험)</label>
            <select v-model="industryKey" aria-label="업종" class="retro-input w-full">
              <option v-for="ind in INDUSTRY_ACCIDENT_RATES" :key="ind.key" :value="ind.key">
                {{ ind.label }} ({{ formatPercent(ind.rate, 1) }})
              </option>
            </select>
          </div>
          <div class="space-y-1">
            <label class="text-tiny font-medium text-muted-foreground">퇴직급여 포함</label>
            <select v-model="includeRetirement" aria-label="퇴직급여 포함 여부" class="retro-input w-full">
              <option :value="true">포함 (1/12)</option>
              <option :value="false">미포함</option>
            </select>
          </div>
        </div>
        <p v-if="validationError" id="labor-cost-error" class="text-caption font-semibold text-destructive" role="alert">
          {{ validationError }}
        </p>
      </div>
    </CalculatorInteractionTracker>

    <BizResultHero
      label="1인 실제 인건비"
      :value="formatWon(result.totalCostPerEmployee)"
      :sub="`급여 대비 +${formatPercent(result.overheadRate, 1)}`"
    />

    <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <div class="retro-stat text-center">
        <p class="retro-stat-label">근로자 실수령</p>
        <p class="retro-stat-value">{{ formatWon(result.employeeNetPay) }}</p>
        <p class="mt-0.5 text-tiny text-muted-foreground">4대보험 공제 후</p>
      </div>
      <div class="retro-stat text-center">
        <p class="retro-stat-label">전체 월 인건비</p>
        <p class="retro-stat-value">{{ formatWon(result.totalMonthlyCost) }}</p>
        <p class="mt-0.5 text-tiny text-muted-foreground">{{ employeeCount }}명 기준</p>
      </div>
      <div class="retro-stat text-center">
        <p class="retro-stat-label">연간 인건비 합계</p>
        <p class="retro-stat-value">{{ formatWon(result.totalAnnualCost) }}</p>
        <p class="mt-0.5 text-tiny text-muted-foreground">12개월 기준</p>
      </div>
    </div>

    <div class="grid gap-4 lg:grid-cols-2">
      <ShBreakdownBar
        label="직원 1명 월 인건비 구성"
        note="세전 급여에 사업주 부담 보험료와 선택한 퇴직급여 적립분을 더한 금액입니다."
        :segments="costSegments"
        :format-value="formatWon"
        surface="outlined"
      />
      <MetricComparisonBars
        title="사업주·근로자 보험료 비교"
        note="소득세를 제외한 월 4대보험 부담액을 같은 기준으로 비교합니다."
        :metrics="insuranceMetrics"
        :format-value="formatWon"
      />
    </div>

    <!-- 4대보험 상세 -->
    <div class="retro-panel overflow-hidden">
      <div class="retro-titlebar rounded-t-2xl">
        <h2 class="retro-title">4대보험 상세 (1인 기준)</h2>
      </div>
      <div class="retro-panel-content p-0">
        <div class="overflow-x-auto">
          <table aria-label="4대보험 사업주·근로자 부담 비교" class="w-full text-left text-caption">
            <thead class="bg-muted/40 text-muted-foreground">
              <tr>
                <th scope="col" class="px-3 py-2">항목</th>
                <th scope="col" class="px-3 py-2 text-right">사업주 부담</th>
                <th scope="col" class="px-3 py-2 text-right">근로자 부담</th>
              </tr>
            </thead>
            <tbody>
              <tr class="border-t border-border/60">
                <td class="px-3 py-2 text-foreground">국민연금</td>
                <td class="px-3 py-2 text-right tabular-nums text-foreground">{{ formatWon(result.employer.nationalPension) }}</td>
                <td class="px-3 py-2 text-right tabular-nums text-foreground">{{ formatWon(result.employee.nationalPension) }}</td>
              </tr>
              <tr class="border-t border-border/60">
                <td class="px-3 py-2 text-foreground">건강보험</td>
                <td class="px-3 py-2 text-right tabular-nums text-foreground">{{ formatWon(result.employer.healthInsurance) }}</td>
                <td class="px-3 py-2 text-right tabular-nums text-foreground">{{ formatWon(result.employee.healthInsurance) }}</td>
              </tr>
              <tr class="border-t border-border/60">
                <td class="px-3 py-2 text-foreground">장기요양보험</td>
                <td class="px-3 py-2 text-right tabular-nums text-foreground">{{ formatWon(result.employer.longTermCare) }}</td>
                <td class="px-3 py-2 text-right tabular-nums text-foreground">{{ formatWon(result.employee.longTermCare) }}</td>
              </tr>
              <tr class="border-t border-border/60">
                <td class="px-3 py-2 text-foreground">고용보험</td>
                <td class="px-3 py-2 text-right tabular-nums text-foreground">{{ formatWon(result.employer.employmentInsurance) }}</td>
                <td class="px-3 py-2 text-right tabular-nums text-foreground">{{ formatWon(result.employee.employmentInsurance) }}</td>
              </tr>
              <tr class="border-t border-border/60">
                <td class="px-3 py-2 text-foreground">산재보험</td>
                <td class="px-3 py-2 text-right tabular-nums text-foreground">{{ formatWon(result.employer.industrialAccident) }}</td>
                <td class="px-3 py-2 text-right tabular-nums text-muted-foreground">—</td>
              </tr>
              <tr v-if="includeRetirement" class="border-t border-border/60">
                <td class="px-3 py-2 text-foreground">퇴직급여 적립</td>
                <td class="px-3 py-2 text-right tabular-nums text-foreground">{{ formatWon(result.retirementReserve) }}</td>
                <td class="px-3 py-2 text-right tabular-nums text-muted-foreground">—</td>
              </tr>
              <tr class="border-t-2 border-primary/30 bg-primary/5">
                <td class="px-3 py-2 font-semibold text-primary">합계</td>
                <td class="px-3 py-2 text-right tabular-nums font-bold text-primary">{{ formatWon(result.employer.totalInsurance + result.retirementReserve) }}</td>
                <td class="px-3 py-2 text-right tabular-nums font-bold text-foreground">{{ formatWon(result.employee.totalInsurance) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div class="retro-panel px-4 py-4 space-y-2 text-caption text-muted-foreground">
      <p>국민연금은 2026년 7월부터 월 기준소득월액 상한 659만원이 적용됩니다.</p>
      <p>산재보험 요율은 업종·사업장 규모·과거 재해율에 따라 달라질 수 있습니다.</p>
      <p>근로소득세(갑근세)는 별도이며, 이 계산기에는 포함되지 않습니다.</p>
      <p class="flex flex-wrap gap-x-2">
        <span>공식 근거:</span>
        <a :href="MINIMUM_WAGE_SOURCE_URL" target="_blank" rel="noopener noreferrer" class="retro-link">고용노동부 2026년 최저임금</a>
        <a :href="NATIONAL_PENSION_SOURCE_URL" target="_blank" rel="noopener noreferrer" class="retro-link">국민연금 기준소득월액</a>
      </p>
    </div>

    <FaqAccordionPanel :items="mergedFaqs" />

    <SeoRichGuide
      :title="BIZ_LABOR_COST_GUIDE.title"
      :intro="BIZ_LABOR_COST_GUIDE.intro"
      :sections="guideSections"
      :sources="BIZ_LABOR_COST_GUIDE.sources"
      :disclaimer="BIZ_LABOR_COST_GUIDE.disclaimer"
    />
  </div>
</template>
