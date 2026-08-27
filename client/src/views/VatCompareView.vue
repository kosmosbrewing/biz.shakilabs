<script setup lang="ts">
import { ref, computed } from "vue";
import { mergeFaqs } from "@/lib/faqMerge";
import { ShPresetGroup, ShSlider } from "@shakilabs/ui";
import { Store, Receipt, AlertCircle } from "lucide-vue-next";
import { Card, CardContent } from "@/components/ui/card";
import SEOHead from "@/components/common/SEOHead.vue";
import BizResultHero from "@/components/biz/BizResultHero.vue";
import CalculatorInteractionTracker from "@/components/analytics/CalculatorInteractionTracker.vue";
import FaqAccordionPanel from "@/components/common/FaqAccordionPanel.vue";
import SeoRichGuide from "@/components/common/SeoRichGuide.vue";
import MetricComparisonBars from "@/components/result-visualization/MetricComparisonBars.vue";
import { BIZ_VAT_GUIDE } from "@/data/seoGuides";
import { calcVatCompare } from "@/utils/bizVatCalc";
import { SIMPLIFIED_VAT_RATES } from "@/data/bizConstants";
import { formatWon, formatManWon } from "@/lib/utils";

const props = defineProps<{ initialRevenue?: number }>();
const amountLabel = computed(() => props.initialRevenue ? formatManWon(props.initialRevenue / 10000) : null);
const seoTitle = computed(() =>
  amountLabel.value
    ? `매출 ${amountLabel.value} 간이과세 vs 일반과세 비교 | shakilabs.com/biz`
    : "간이과세 vs 일반과세 부가세 비교 | shakilabs.com/biz",
);
const seoDesc = computed(() =>
  amountLabel.value
    ? `연 매출 ${amountLabel.value}원 기준, 간이과세와 일반과세 중 어느 쪽이 부가세가 적은지 비교합니다.`
    : "연 매출 기준, 간이과세와 일반과세 중 어느 쪽이 부가세가 적은지 비교합니다.",
);
// 금액 변형(/vat-compare/:amount)은 기본 계산기와 동일한 본문을 프리렌더하므로
// 중복으로 경쟁하는 대신 기본 페이지로 canonical을 모은다.
const canonicalPath = computed(() => (props.initialRevenue ? "/vat-compare" : undefined));

const annualRevenue = ref(props.initialRevenue ?? 80_000_000);
const industryKey = ref("food");
const purchaseRate = ref(0.40);

const revenueDisplay = computed({
  get: () => annualRevenue.value.toLocaleString("ko-KR"),
  set: (v: string) => {
    const n = Number(v.replace(/[^0-9]/g, ""));
    if (!Number.isNaN(n)) annualRevenue.value = n;
  },
});

const industries = Object.entries(SIMPLIFIED_VAT_RATES).map(([key, val]) => ({
  key,
  label: val.label,
  rate: val.rate,
}));
const industryOptions = industries.map((industry) => ({
  label: `${industry.label} (${(industry.rate * 100).toFixed(0)}%)`,
  value: industry.key,
}));

const result = computed(() =>
  calcVatCompare(annualRevenue.value, industryKey.value, purchaseRate.value),
);

const presets = [
  { label: "3천만", value: 30_000_000 },
  { label: "5천만", value: 50_000_000 },
  { label: "8천만", value: 80_000_000 },
  { label: "1억", value: 100_000_000 },
];

const faqItems = [
  {
    q: "간이과세자와 일반과세자의 기준은 무엇인가요?",
    a: "직전연도 매출이 1억 400만원 미만이면 간이과세를 선택할 수 있습니다. 다만 부동산임대업·과세유흥장소는 4,800만원 미만이 기준이며, 간이과세 납부 면제는 연 매출 4,800만원 미만에 해당합니다.",
  },
  {
    q: "간이과세자도 세금계산서를 발행할 수 있나요?",
    a: "연 매출 4,800만원 이상의 간이과세자는 세금계산서를 발행할 수 있습니다. 다만 4,800만원 미만(납부 면제 대상)은 세금계산서 발행이 불가하며, 영수증만 발행 가능합니다.",
  },
  {
    q: "매입 비율이 높으면 어느 쪽이 유리한가요?",
    a: "매입(세금계산서 매입)이 많을수록 일반과세가 유리합니다. 일반과세는 매출세액에서 매입세액을 공제받지만, 간이과세는 매입세액 공제가 제한적이기 때문입니다.",
  },
] as const;

// 화면에 실제 렌더되는 병합 FAQ와 구조화 데이터를 일치시킨다 (스키마 규칙)
const mergedFaqs = mergeFaqs(faqItems, BIZ_VAT_GUIDE.faqs);
const faqJsonLd = computed(() => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: mergedFaqs.map((faq) => ({
    "@type": "Question",
    name: faq.q,
    acceptedAnswer: { "@type": "Answer", text: faq.a },
  })),
}));

const vatMetrics = computed(() => [{
  key: "vat",
  label: "예상 연간 부가세",
  values: [
    {
      key: "general",
      label: "일반과세",
      value: result.value.generalVat,
      highlight: result.value.recommendation === "general" || !result.value.isSimplifiedEligible,
    },
    {
      key: "simplified",
      label: "간이과세",
      value: result.value.simplifiedVat,
      highlight: result.value.recommendation === "simplified" && result.value.isSimplifiedEligible,
      detail: result.value.isSimplifiedEligible ? undefined : "현재 매출에서는 적용 불가",
    },
  ],
}]);
</script>

<template>
  <SEOHead
    :title="seoTitle"
    :description="seoDesc"
    :canonical-path="canonicalPath"
    :json-ld="faqJsonLd"
  />

  <div class="container py-6 sm:py-8 max-w-3xl">
    <h1 class="text-h1 font-bold text-foreground mb-1">간이과세 vs 일반과세</h1>
    <p class="text-caption text-muted-foreground mb-6">
      연 매출과 업종으로 부가가치세 차이를 비교합니다.
    </p>

    <!-- 입력 -->
    <CalculatorInteractionTracker calculator-id="vat_compare" page-path="/biz/vat-compare">
    <div class="retro-panel p-4 sm:p-5 space-y-4 mb-6">
      <div>
        <label class="block text-caption font-semibold text-foreground mb-1.5">연 매출액 (공급가액 기준)</label>
        <div class="relative">
          <input
            aria-label="연 매출액"
            v-model="revenueDisplay"
            type="text"
            inputmode="numeric"
            class="retro-input w-full pr-8"
          />
          <span class="absolute right-3 top-1/2 -translate-y-1/2 text-tiny text-muted-foreground">원</span>
        </div>
        <ShPresetGroup
          v-model="annualRevenue"
          :options="presets"
          label="연 매출액 빠른 선택"
          class="mt-2"
        />
      </div>

      <div>
        <label class="block text-caption font-semibold text-foreground mb-1.5">업종</label>
        <ShPresetGroup
          v-model="industryKey"
          :options="industryOptions"
          label="업종 선택"
        />
      </div>

      <div>
        <label class="block text-caption font-semibold text-foreground mb-1.5">
          매입 비율: {{ (purchaseRate * 100).toFixed(0) }}%
          <span class="text-tiny text-muted-foreground font-normal ml-1">(세금계산서 매입분)</span>
        </label>
        <ShSlider
          v-model="purchaseRate"
          :min="0.05"
          :max="0.8"
          :step="0.05"
          :value-text="`매입 비율 ${(purchaseRate * 100).toFixed(0)}%`"
          aria-label="매입 비율 슬라이더"
        />
      </div>
    </div>
    </CalculatorInteractionTracker>

    <!-- 결과 -->
    <Card class="mb-6">
      <CardContent class="p-4 sm:p-5">
        <!-- 간이과세 적격 여부 -->
        <div v-if="!result.isSimplifiedEligible" class="mb-4 rounded-lg bg-destructive/10 p-3 text-caption text-destructive font-medium">
          선택한 업종은 연 매출 {{ formatWon(result.simplifiedThreshold) }} 이상이면 간이과세 적용이 불가합니다. 일반과세만 가능합니다.
        </div>

        <div v-if="result.isSimplifiedExempt && result.isSimplifiedEligible" class="mb-4 rounded-lg bg-primary/10 p-3 text-caption text-primary font-medium">
          연 매출 4,800만원 미만 — 간이과세 납부 면제 대상입니다.
        </div>

        <BizResultHero
          v-if="result.isSimplifiedEligible"
          class="mb-4"
          flat
          label="연간 부가세 차이"
          :value="formatWon(Math.abs(result.difference))"
          :sub="`${result.recommendation === 'simplified' ? '간이과세' : '일반과세'}가 유리`"
        />

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <!-- 일반과세 -->
          <Card class="border-status-info/25">
            <CardContent class="biz-compare-card p-4 text-center space-y-2">
              <div class="flex items-center justify-center gap-2">
                <span class="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-status-info/10 text-status-info">
                  <Receipt class="h-3.5 w-3.5" />
                </span>
                <h3 class="text-caption font-bold text-status-info">일반과세</h3>
              </div>
              <p class="text-caption text-muted-foreground">연간 부가세</p>
              <p class="text-h1 font-bold text-foreground tabular-nums">{{ formatWon(result.generalVat) }}</p>
            </CardContent>
          </Card>

          <!-- 간이과세 -->
          <Card class="border-primary/25">
            <CardContent class="biz-compare-card p-4 text-center space-y-2">
              <div class="flex items-center justify-center gap-2">
                <span class="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Store class="h-3.5 w-3.5" />
                </span>
                <h3 class="text-caption font-bold text-primary">간이과세</h3>
              </div>
              <p class="text-caption text-muted-foreground">
                {{ result.isSimplifiedExempt ? '납부 면제' : '연간 부가세' }}
              </p>
              <p class="text-h1 font-bold text-foreground tabular-nums">
                {{ result.isSimplifiedEligible ? formatWon(result.simplifiedVat) : '-' }}
              </p>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>

    <MetricComparisonBars
      class="mb-6"
      title="과세 유형별 부가세 비교"
      note="같은 매출·매입 가정에서 예상되는 연간 납부액입니다. 강조 표시는 현재 조건의 권장 유형입니다."
      :metrics="vatMetrics"
      :format-value="formatWon"
    />

    <!-- 과세 유형 기준 -->
    <Card class="border-border/60">
      <CardContent class="p-4">
        <div class="flex items-center gap-2 mb-2">
          <span class="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <AlertCircle class="h-3.5 w-3.5" />
          </span>
          <p class="text-tiny font-semibold text-foreground">과세 유형 기준 (2026년)</p>
        </div>
        <ul class="list-disc pl-4 space-y-0.5 text-tiny text-muted-foreground">
          <li>간이과세 적용 기준: 연 매출 1억 400만원 미만, 다만 부동산임대업·과세유흥장소는 4,800만원 미만</li>
          <li>간이과세 납부의무 면제: 연 매출 4,800만원 미만</li>
          <li>일반과세: 부가세 = 매출세액(10%) - 매입세액</li>
          <li>간이과세: 부가세 = 매출액 × 업종별 부가가치율 × 10%</li>
        </ul>
      </CardContent>
    </Card>

    <FaqAccordionPanel :items="mergedFaqs" />

    <SeoRichGuide
      :title="BIZ_VAT_GUIDE.title"
      :intro="BIZ_VAT_GUIDE.intro"
      :sections="BIZ_VAT_GUIDE.sections"      :disclaimer="BIZ_VAT_GUIDE.disclaimer"
    />
  </div>
</template>
