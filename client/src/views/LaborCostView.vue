<script setup lang="ts">
import { computed, ref } from "vue";
import FreshBadge from "@/components/common/FreshBadge.vue";
import SEOHead from "@/components/common/SEOHead.vue";
import SeoRichGuide from "@/components/common/SeoRichGuide.vue";
import { BIZ_LABOR_COST_GUIDE } from "@/data/seoGuides";
import {
  INDUSTRY_ACCIDENT_RATES,
  LABOR_COST_FAQS,
  LABOR_COST_SALARY_PRESETS,
  LABOR_COST_UPDATED,
} from "@/data/laborCost";
import { formatManWon, formatPercent, formatWon } from "@/lib/utils";
import { calculateLaborCost } from "@/utils/laborCostCalc";

const props = defineProps<{ initialSalary?: number }>();

const monthlySalary = ref(props.initialSalary ?? 3_000_000);
const employeeCount = ref(1);
const industryKey = ref("office");
const includeRetirement = ref(true);

const result = computed(() =>
  calculateLaborCost({
    monthlySalary: monthlySalary.value,
    employeeCount: employeeCount.value,
    industryKey: industryKey.value,
    includeRetirement: includeRetirement.value,
  }),
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

const faqJsonLd = computed(() => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: LABOR_COST_FAQS.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
}));
</script>

<template>
  <SEOHead :title="seoTitle" :description="seoDescription" :json-ld="faqJsonLd" />

  <div class="container space-y-5 py-5 max-w-4xl">
    <!-- 헤더 -->
    <div class="retro-panel overflow-hidden">
      <div class="retro-titlebar rounded-t-2xl">
        <h1 class="retro-title">인건비 계산기</h1>
        <FreshBadge :message="`${LABOR_COST_UPDATED} 기준`" />
      </div>
      <div class="retro-panel-content space-y-2">
        <p class="text-body text-muted-foreground">월급을 입력하면 사업주 부담 4대보험, 퇴직급여, 총 인건비를 계산합니다.</p>
      </div>
    </div>

    <!-- 입력 -->
    <div class="retro-panel p-4 sm:p-5 space-y-4">
      <div class="space-y-1">
        <label class="text-tiny font-medium text-muted-foreground">월 급여 (세전)</label>
        <input v-model.number="monthlySalary" type="number" min="100000" class="retro-input w-full" />
        <div class="flex flex-wrap gap-2">
          <button
            v-for="p in LABOR_COST_SALARY_PRESETS"
            :key="p.value"
            type="button"
            :class="[
              'px-3 py-1.5 rounded-md text-tiny font-medium border transition-colors',
              monthlySalary === p.value
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-muted/50 text-muted-foreground border-border hover:border-primary/50',
            ]"
            @click="monthlySalary = p.value"
          >
            {{ p.label }}
          </button>
        </div>
      </div>

      <div class="grid gap-3 sm:grid-cols-3">
        <div class="space-y-1">
          <label class="text-tiny font-medium text-muted-foreground">직원 수</label>
          <input v-model.number="employeeCount" type="number" min="1" max="10000" class="retro-input w-full" />
        </div>
        <div class="space-y-1">
          <label class="text-tiny font-medium text-muted-foreground">업종 (산재보험)</label>
          <select v-model="industryKey" class="retro-input w-full">
            <option v-for="ind in INDUSTRY_ACCIDENT_RATES" :key="ind.key" :value="ind.key">
              {{ ind.label }} ({{ formatPercent(ind.rate * 100, 1) }})
            </option>
          </select>
        </div>
        <div class="space-y-1">
          <label class="text-tiny font-medium text-muted-foreground">퇴직급여 포함</label>
          <select v-model="includeRetirement" class="retro-input w-full">
            <option :value="true">포함 (1/12)</option>
            <option :value="false">미포함</option>
          </select>
        </div>
      </div>
    </div>

    <!-- 핵심 지표 -->
    <div class="grid gap-3 md:grid-cols-4">
      <div class="retro-panel-muted px-4 py-4">
        <p class="text-tiny text-muted-foreground">1인 실제 인건비</p>
        <p class="mt-2 text-h2 font-bold text-primary">{{ formatWon(result.totalCostPerEmployee) }}</p>
        <p class="text-tiny text-muted-foreground">급여 대비 +{{ formatPercent(result.overheadRate * 100, 1) }}</p>
      </div>
      <div class="retro-panel-muted px-4 py-4">
        <p class="text-tiny text-muted-foreground">근로자 실수령</p>
        <p class="mt-2 text-h2 font-bold text-foreground">{{ formatWon(result.employeeNetPay) }}</p>
        <p class="text-tiny text-muted-foreground">4대보험 공제 후</p>
      </div>
      <div class="retro-panel-muted px-4 py-4">
        <p class="text-tiny text-muted-foreground">전체 월 인건비</p>
        <p class="mt-2 text-h2 font-bold text-foreground">{{ formatWon(result.totalMonthlyCost) }}</p>
        <p class="text-tiny text-muted-foreground">{{ employeeCount }}명 기준</p>
      </div>
      <div class="retro-panel-muted px-4 py-4">
        <p class="text-tiny text-muted-foreground">연간 인건비 합계</p>
        <p class="mt-2 text-h2 font-bold text-foreground">{{ formatWon(result.totalAnnualCost) }}</p>
        <p class="text-tiny text-muted-foreground">12개월 기준</p>
      </div>
    </div>

    <!-- 4대보험 상세 -->
    <div class="retro-panel overflow-hidden">
      <div class="retro-titlebar rounded-t-2xl">
        <h2 class="retro-title">4대보험 상세 (1인 기준)</h2>
      </div>
      <div class="retro-panel-content p-0">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-caption">
            <thead class="bg-muted/40 text-muted-foreground">
              <tr>
                <th class="px-3 py-2">항목</th>
                <th class="px-3 py-2 text-right">사업주 부담</th>
                <th class="px-3 py-2 text-right">근로자 부담</th>
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

    <!-- 유의사항 -->
    <div class="retro-panel px-4 py-4 space-y-2 text-caption text-muted-foreground">
      <p>국민연금은 월 기준소득월액 상한 637만원이 적용됩니다.</p>
      <p>산재보험 요율은 업종·사업장 규모·과거 재해율에 따라 달라질 수 있습니다.</p>
      <p>근로소득세(갑근세)는 별도이며, 이 계산기에는 포함되지 않습니다.</p>
    </div>

    <!-- FAQ -->
    <div class="retro-panel overflow-hidden">
      <div class="retro-titlebar rounded-t-2xl">
        <h2 class="retro-title">자주 묻는 질문</h2>
      </div>
      <div class="retro-panel-content space-y-4">
        <details v-for="faq in LABOR_COST_FAQS" :key="faq.q" class="group">
          <summary class="cursor-pointer text-body font-medium text-foreground list-none flex items-center justify-between py-2">
            {{ faq.q }}
            <span class="text-muted-foreground transition-transform group-open:rotate-180">▾</span>
          </summary>
          <p class="text-caption text-muted-foreground leading-6 pb-2">{{ faq.a }}</p>
        </details>
      </div>
    </div>

    <SeoRichGuide
      :title="BIZ_LABOR_COST_GUIDE.title"
      :intro="BIZ_LABOR_COST_GUIDE.intro"
      :sections="BIZ_LABOR_COST_GUIDE.sections"
      :faqs="BIZ_LABOR_COST_GUIDE.faqs"
      :disclaimer="BIZ_LABOR_COST_GUIDE.disclaimer"
    />
  </div>
</template>
