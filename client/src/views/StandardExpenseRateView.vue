<script setup lang="ts">
import { computed, ref } from "vue";
import { ShPresetGroup } from "@shakilabs/ui";
import FreshBadge from "@/components/common/FreshBadge.vue";
import SEOHead from "@/components/common/SEOHead.vue";
import CalculatorPageHeader from "@/components/biz/CalculatorPageHeader.vue";
import SeoRichGuide from "@/components/common/SeoRichGuide.vue";
import MetricComparisonBars from "@/components/result-visualization/MetricComparisonBars.vue";
import { BIZ_HOME_GUIDE } from "@/data/seoGuides";
import {
  BIZ_EXPENSE_RATE_UPDATED,
  EXPENSE_RATE_FAQS,
  EXPENSE_RATE_REVENUE_PRESETS,
  INDUSTRY_EXPENSE_RATES,
} from "@/data/standardExpenseRate";
import { formatManWon, formatPercent, formatWon } from "@/lib/utils";
import { calculateStandardExpenseRate } from "@/utils/standardExpenseRateCalc";
import { useSafeCalculation } from "@/composables/useSafeCalculation";

const props = defineProps<{ initialRevenue?: number }>();

const revenue = ref(props.initialRevenue ?? 100_000_000);
const industryKey = ref("it");
const purchaseCost = ref(10_000_000);
const rentCost = ref(12_000_000);
const laborCost = ref(15_000_000);

const industry = computed(() =>
  INDUSTRY_EXPENSE_RATES.find((i) => i.key === industryKey.value) ?? INDUSTRY_EXPENSE_RATES[0],
);

const { result, validationError } = useSafeCalculation(
  () => calculateStandardExpenseRate({
    revenue: revenue.value,
    standardRate: industry.value.standardRate,
    simpleRate: industry.value.simpleRate,
    purchaseCost: purchaseCost.value,
    rentCost: rentCost.value,
    laborCost: laborCost.value,
  }),
  calculateStandardExpenseRate({ revenue: 100_000_000, standardRate: 18.5, simpleRate: 64.1, purchaseCost: 10_000_000, rentCost: 12_000_000, laborCost: 15_000_000 }),
);

const amountLabel = computed(() => (props.initialRevenue ? formatManWon(props.initialRevenue / 10000) : null));
const seoTitle = computed(() =>
  amountLabel.value
    ? `매출 ${amountLabel.value} 기준경비율 계산기 | shakilabs.com/biz`
    : "기준경비율 계산기 | 단순경비율 비교 종합소득세 계산",
);
const seoDescription = computed(() =>
  amountLabel.value
    ? `매출 ${amountLabel.value}원 기준 기준경비율과 단순경비율 방식의 세금 차이를 비교합니다.`
    : "매출과 업종을 선택하면 기준경비율·단순경비율 방식별 소득세를 비교 계산합니다.",
);

const faqJsonLd = computed(() => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: EXPENSE_RATE_FAQS.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
}));

const methodMetrics = computed(() => [
  {
    key: "tax",
    label: "총 세금",
    values: [
      { key: "standard", label: "기준경비율", value: result.value.standard.totalTax, highlight: result.value.recommendation === "standard" },
      { key: "simple", label: "단순경비율", value: result.value.simple.totalTax, highlight: result.value.recommendation === "simple" },
    ],
  },
  {
    key: "income",
    label: "세후 소득",
    values: [
      { key: "standard", label: "기준경비율", value: result.value.standard.afterTaxIncome, highlight: result.value.recommendation === "standard" },
      { key: "simple", label: "단순경비율", value: result.value.simple.afterTaxIncome, highlight: result.value.recommendation === "simple" },
    ],
  },
]);
</script>

<template>
  <SEOHead :title="seoTitle" :description="seoDescription" :json-ld="faqJsonLd" />

  <div class="container space-y-5 py-5 max-w-4xl">
    <CalculatorPageHeader title="기준경비율 계산기" />

    <!-- 헤더 -->
    <div class="retro-panel overflow-hidden">
      <div class="retro-titlebar rounded-t-2xl">
        <h2 class="retro-title">계산 기준 안내</h2>
        <FreshBadge :message="`${BIZ_EXPENSE_RATE_UPDATED} 기준`" />
      </div>
      <div class="retro-panel-content space-y-2">
        <p class="text-body text-muted-foreground">매출과 업종을 선택하면 기준경비율·단순경비율 방식별 소득세를 비교합니다.</p>
      </div>
    </div>

    <div class="retro-panel p-4 sm:p-5 space-y-4" role="group" :aria-describedby="validationError ? 'expense-rate-error' : undefined">
      <div class="space-y-1">
        <label for="expense-revenue" class="text-tiny font-medium text-muted-foreground">연간 매출액</label>
        <input id="expense-revenue" v-model.number="revenue" type="number" min="0" class="retro-input w-full" />
        <ShPresetGroup
          v-model="revenue"
          :options="EXPENSE_RATE_REVENUE_PRESETS"
          label="연간 매출액 빠른 선택"
        />
      </div>

      <div class="space-y-1">
        <label for="expense-industry" class="text-tiny font-medium text-muted-foreground">업종 선택</label>
        <select id="expense-industry" v-model="industryKey" class="retro-input w-full">
          <option v-for="ind in INDUSTRY_EXPENSE_RATES" :key="ind.key" :value="ind.key">
            {{ ind.label }} (기준 {{ ind.standardRate }}% / 단순 {{ ind.simpleRate }}%)
          </option>
        </select>
      </div>

      <div class="space-y-1">
        <p class="text-tiny font-medium text-muted-foreground">주요경비 (기준경비율 적용 시)</p>
        <div class="grid gap-3 sm:grid-cols-3">
          <div>
            <label for="expense-purchase-cost" class="text-tiny text-muted-foreground">매입비용</label>
            <input id="expense-purchase-cost" v-model.number="purchaseCost" type="number" min="0" class="retro-input w-full" />
          </div>
          <div>
            <label for="expense-rent-cost" class="text-tiny text-muted-foreground">임차료 (연)</label>
            <input id="expense-rent-cost" v-model.number="rentCost" type="number" min="0" class="retro-input w-full" />
          </div>
          <div>
            <label for="expense-labor-cost" class="text-tiny text-muted-foreground">인건비 (연)</label>
            <input id="expense-labor-cost" v-model.number="laborCost" type="number" min="0" class="retro-input w-full" />
          </div>
        </div>
      </div>
      <p v-if="validationError" id="expense-rate-error" class="text-caption font-semibold text-destructive" role="alert">
        {{ validationError }}
      </p>
    </div>

    <div class="grid gap-3 md:grid-cols-2">
      <div class="retro-panel p-4 sm:p-5 space-y-3" :class="result.recommendation === 'standard' ? 'ring-2 ring-primary/30' : ''">
        <div class="flex items-center justify-between">
          <h2 class="text-body font-semibold">기준경비율 방식</h2>
          <span v-if="result.recommendation === 'standard'" class="rounded-full bg-primary/10 px-2.5 py-0.5 text-tiny font-medium text-primary">유리</span>
        </div>
        <div class="space-y-2 text-caption">
          <div class="flex justify-between"><span class="text-muted-foreground">경비 합계</span><span>{{ formatWon(result.standard.expenses) }}</span></div>
          <div class="flex justify-between"><span class="text-muted-foreground">소득금액</span><span class="font-medium">{{ formatWon(result.standard.taxableIncome) }}</span></div>
          <div class="flex justify-between"><span class="text-muted-foreground">소득세</span><span>{{ formatWon(result.standard.incomeTax) }}</span></div>
          <div class="flex justify-between"><span class="text-muted-foreground">지방소득세</span><span>{{ formatWon(result.standard.localTax) }}</span></div>
        </div>
        <div class="border-t pt-2">
          <div class="flex justify-between text-body font-bold">
            <span>총 세금</span>
            <span class="text-primary">{{ formatWon(result.standard.totalTax) }}</span>
          </div>
          <p class="text-tiny text-muted-foreground">실효세율 {{ formatPercent(result.standard.effectiveRate, 1) }}</p>
        </div>
      </div>

      <div class="retro-panel p-4 sm:p-5 space-y-3" :class="result.recommendation === 'simple' ? 'ring-2 ring-primary/30' : ''">
        <div class="flex items-center justify-between">
          <h2 class="text-body font-semibold">단순경비율 방식</h2>
          <span v-if="result.recommendation === 'simple'" class="rounded-full bg-primary/10 px-2.5 py-0.5 text-tiny font-medium text-primary">유리</span>
        </div>
        <div class="space-y-2 text-caption">
          <div class="flex justify-between"><span class="text-muted-foreground">경비 합계</span><span>{{ formatWon(result.simple.expenses) }}</span></div>
          <div class="flex justify-between"><span class="text-muted-foreground">소득금액</span><span class="font-medium">{{ formatWon(result.simple.taxableIncome) }}</span></div>
          <div class="flex justify-between"><span class="text-muted-foreground">소득세</span><span>{{ formatWon(result.simple.incomeTax) }}</span></div>
          <div class="flex justify-between"><span class="text-muted-foreground">지방소득세</span><span>{{ formatWon(result.simple.localTax) }}</span></div>
        </div>
        <div class="border-t pt-2">
          <div class="flex justify-between text-body font-bold">
            <span>총 세금</span>
            <span class="text-primary">{{ formatWon(result.simple.totalTax) }}</span>
          </div>
          <p class="text-tiny text-muted-foreground">실효세율 {{ formatPercent(result.simple.effectiveRate, 1) }}</p>
        </div>
      </div>
    </div>

    <MetricComparisonBars
      title="경비율 방식별 결과 비교"
      note="총 세금과 세후 소득은 단위는 같지만 기준값이 달라 각 지표 안에서 비교합니다."
      :metrics="methodMetrics"
      :format-value="formatWon"
    />

    <!-- 차이 요약 -->
    <div class="retro-panel-muted px-4 py-4 text-center">
      <p class="text-caption text-muted-foreground">{{ result.recommendation === 'standard' ? '기준경비율' : '단순경비율' }} 방식이</p>
      <p class="text-h2 font-bold text-primary">{{ formatWon(Math.abs(result.taxDifference)) }}</p>
      <p class="text-caption text-muted-foreground">더 절세됩니다</p>
    </div>

    <div class="retro-panel px-4 py-4 space-y-2 text-caption text-muted-foreground">
      <p>단순경비율은 직전 과세기간 수입금액이 업종별 기준({{ industry.label }}: {{ industry.simpleThreshold.toLocaleString() }}만원) 이하인 경우에만 적용 가능합니다.</p>
      <p>기준경비율 적용 시 주요경비는 세금계산서, 계산서, 신용카드 등 적격증빙이 필요합니다.</p>
      <p>이 계산기는 간이 추정이며, 실제 신고 시 세무사 상담을 권장합니다.</p>
    </div>

    <!-- FAQ -->
    <div class="retro-panel overflow-hidden">
      <div class="retro-titlebar rounded-t-2xl">
        <h2 class="retro-title">자주 묻는 질문</h2>
      </div>
      <div class="retro-panel-content space-y-4">
        <details v-for="faq in EXPENSE_RATE_FAQS" :key="faq.q" class="group">
          <summary class="cursor-pointer text-body font-medium text-foreground list-none flex items-center justify-between py-2">
            {{ faq.q }}
            <span class="text-muted-foreground transition-transform group-open:rotate-180">▾</span>
          </summary>
          <p class="text-caption text-muted-foreground leading-6 pb-2">{{ faq.a }}</p>
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
