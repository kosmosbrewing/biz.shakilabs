<script setup lang="ts">
import { ref, computed } from "vue";
import { User, Building2, AlertCircle } from "lucide-vue-next";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import SEOHead from "@/components/common/SEOHead.vue";
import SeoRichGuide from "@/components/common/SeoRichGuide.vue";
import { BIZ_INDIVIDUAL_VS_CORP_GUIDE } from "@/data/seoGuides";
import { calcIndividualAfterTax, calcCorpAfterTax } from "@/utils/bizCalc";
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

const revenue = ref(props.initialRevenue ?? 100_000_000);
const expenseRate = ref(0.40);
const corpSalary = ref(36_000_000);

const revenueDisplay = computed({
  get: () => revenue.value.toLocaleString("ko-KR"),
  set: (v: string) => {
    const n = Number(v.replace(/[^0-9]/g, ""));
    if (!Number.isNaN(n)) revenue.value = n;
  },
});

const corpSalaryDisplay = computed({
  get: () => corpSalary.value.toLocaleString("ko-KR"),
  set: (v: string) => {
    const n = Number(v.replace(/[^0-9]/g, ""));
    if (!Number.isNaN(n)) corpSalary.value = n;
  },
});

const individual = computed(() => calcIndividualAfterTax(revenue.value, expenseRate.value));
const corp = computed(() => calcCorpAfterTax(revenue.value, expenseRate.value, corpSalary.value));

const difference = computed(() => corp.value.afterTaxIncome - individual.value.afterTaxIncome);
const betterOption = computed(() => difference.value > 0 ? "법인" : difference.value < 0 ? "개인" : "동일");

const presets = [
  { label: "5천만", value: 50_000_000 },
  { label: "1억", value: 100_000_000 },
  { label: "2억", value: 200_000_000 },
  { label: "5억", value: 500_000_000 },
];

const faqItems = [
  {
    q: "개인사업자에서 법인으로 전환하면 무조건 유리한가요?",
    a: "반드시 그렇지는 않습니다. 법인 설립비·세무기장료·4대보험 사업주 부담 등 간접비용이 추가되고, 법인에서 이익을 꺼낼 때 배당소득세가 발생합니다. 일반적으로 과세소득이 연 5,000만원 이상부터 법인이 유리해지는 경우가 많습니다.",
  },
  {
    q: "법인 대표이사 연봉은 어떻게 정하나요?",
    a: "대표이사 급여는 법인 비용으로 처리되어 법인세 과세표준을 줄여줍니다. 다만 급여에는 소득세와 4대보험이 부과되므로, 법인세율과 소득세율의 균형점을 찾아 설정하는 것이 절세에 유리합니다.",
  },
  {
    q: "경비율(필요경비)은 어떤 의미인가요?",
    a: "매출에서 차감하는 사업 관련 비용(재료비·임대료·인건비 등)의 비율입니다. 경비율이 높을수록 과세소득이 줄어 세금이 줄지만, 실제 발생한 비용만 인정됩니다.",
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
  <SEOHead
    :title="seoTitle"
    :description="seoDesc"
    :json-ld="faqJsonLd"
  />

  <div class="container py-6 sm:py-8 max-w-3xl">
    <h1 class="text-h1 font-bold text-foreground mb-1">개인사업자 vs 법인 세후소득</h1>
    <p class="text-caption text-muted-foreground mb-6">
      동일 매출·경비율 기준으로 세후 실수령을 비교합니다.
    </p>

    <!-- 입력 섹션 -->
    <div class="retro-panel p-4 sm:p-5 space-y-4 mb-6">
      <div>
        <label class="block text-caption font-semibold text-foreground mb-1.5">연 매출액</label>
        <div class="flex gap-2 flex-wrap mb-2">
          <button
            v-for="p in presets"
            :key="p.value"
            type="button"
            :class="[
              'px-3 py-1.5 rounded-md text-tiny font-medium border transition-colors',
              revenue === p.value
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-muted/50 text-muted-foreground border-border hover:border-primary/40',
            ]"
            @click="revenue = p.value"
          >
            {{ p.label }}
          </button>
        </div>
        <div class="relative">
          <input
            v-model="revenueDisplay"
            type="text"
            inputmode="numeric"
            class="retro-input w-full pr-8"
          />
          <span class="absolute right-3 top-1/2 -translate-y-1/2 text-tiny text-muted-foreground">원</span>
        </div>
      </div>

      <div>
        <label class="block text-caption font-semibold text-foreground mb-1.5">
          경비율: {{ (expenseRate * 100).toFixed(0) }}%
        </label>
        <input
          v-model.number="expenseRate"
          type="range"
          min="0.1"
          max="0.8"
          step="0.05"
          class="w-full accent-primary"
        />
        <div class="flex justify-between text-tiny text-muted-foreground">
          <span>10%</span>
          <span>80%</span>
        </div>
      </div>

      <div>
        <label class="block text-caption font-semibold text-foreground mb-1.5">법인 대표이사 연봉</label>
        <div class="relative">
          <input
            v-model="corpSalaryDisplay"
            type="text"
            inputmode="numeric"
            class="retro-input w-full pr-8"
          />
          <span class="absolute right-3 top-1/2 -translate-y-1/2 text-tiny text-muted-foreground">원</span>
        </div>
      </div>
    </div>

    <!-- 결과 비교 -->
    <Card class="mb-6">
      <CardContent class="p-4 sm:p-5">
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

        <div class="grid grid-cols-2 gap-4">
          <!-- 개인사업자 -->
          <Card class="border-blue-200/50 dark:border-blue-800/50">
            <CardContent class="p-4 space-y-2">
              <div class="flex items-center justify-center gap-2">
                <span class="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <User class="h-3.5 w-3.5" />
                </span>
                <h3 class="text-caption font-bold text-blue-600 dark:text-blue-400">개인사업자</h3>
              </div>
              <div class="text-center">
                <p class="text-h1 font-bold text-foreground">{{ formatWon(individual.afterTaxIncome) }}</p>
                <p class="text-tiny text-muted-foreground">세후소득</p>
              </div>
              <div class="space-y-1 text-tiny">
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

          <!-- 법인 -->
          <Card class="border-primary/25">
            <CardContent class="p-4 space-y-2">
              <div class="flex items-center justify-center gap-2">
                <span class="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Building2 class="h-3.5 w-3.5" />
                </span>
                <h3 class="text-caption font-bold text-primary">법인</h3>
              </div>
              <div class="text-center">
                <p class="text-h1 font-bold text-foreground">{{ formatWon(corp.afterTaxIncome) }}</p>
                <p class="text-tiny text-muted-foreground">세후소득</p>
              </div>
              <div class="space-y-1 text-tiny">
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

    <!-- 유의사항 -->
    <Card class="border-border/60">
      <CardContent class="p-4">
        <div class="flex items-center gap-2 mb-2">
          <span class="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <AlertCircle class="h-3.5 w-3.5" />
          </span>
          <p class="text-tiny font-semibold text-foreground">유의사항</p>
        </div>
        <ul class="list-disc pl-4 space-y-0.5 text-tiny text-muted-foreground">
          <li>개인사업자는 종합소득세(6~45%), 법인은 법인세(9~24%) + 배당소득세(15.4%) 구조입니다.</li>
          <li>법인 설립비·세무기장료·4대보험 사업주 부담 등 간접비용은 별도입니다.</li>
          <li>각종 공제·감면(중소기업 특별세액감면 등)은 반영되지 않았습니다.</li>
        </ul>
      </CardContent>
    </Card>

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
      :title="BIZ_INDIVIDUAL_VS_CORP_GUIDE.title"
      :intro="BIZ_INDIVIDUAL_VS_CORP_GUIDE.intro"
      :sections="BIZ_INDIVIDUAL_VS_CORP_GUIDE.sections"
      :checklist="BIZ_INDIVIDUAL_VS_CORP_GUIDE.checklist"
      :faqs="BIZ_INDIVIDUAL_VS_CORP_GUIDE.faqs"
      :disclaimer="BIZ_INDIVIDUAL_VS_CORP_GUIDE.disclaimer"
    />
  </div>
</template>
