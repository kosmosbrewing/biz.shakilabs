<script setup lang="ts">
import { ref, computed } from "vue";
import SEOHead from "@/components/common/SEOHead.vue";
import SeoRichGuide from "@/components/common/SeoRichGuide.vue";
import BreakdownStackedBar from "@/components/result-visualization/BreakdownStackedBar.vue";
import MetricComparisonBars from "@/components/result-visualization/MetricComparisonBars.vue";
import { BIZ_HOME_GUIDE } from "@/data/seoGuides";
import { BIZ_DATA_VERIFIED, DELIVERY_FEE_SOURCE_URL } from "@/data/bizConstants";
import { calcDeliveryFees } from "@/utils/bizDeliveryCalc";
import { formatWon, formatPercent } from "@/lib/utils";

const orderAmount = ref(20_000);
const monthlyOrders = ref(500);

const orderDisplay = computed({
  get: () => orderAmount.value.toLocaleString("ko-KR"),
  set: (v: string) => {
    const n = Number(v.replace(/[^0-9]/g, ""));
    if (!Number.isNaN(n)) orderAmount.value = n;
  },
});

const results = computed(() => calcDeliveryFees(orderAmount.value, monthlyOrders.value));

const totalRevenue = computed(() => orderAmount.value * monthlyOrders.value);

const bestApp = computed(() => {
  if (results.value.length === 0) return null;
  return results.value.reduce((best, cur) => cur.totalFee < best.totalFee ? cur : best);
});

const deliveryMetrics = computed(() => [
  {
    key: "fee",
    label: "월 총 수수료",
    values: results.value.map((app) => ({
      key: app.appKey,
      label: app.appName,
      value: app.totalFee,
      highlight: app.appKey === bestApp.value?.appKey,
      detail: `실질 수수료율 ${formatPercent(app.feeRate)}`,
    })),
  },
  {
    key: "net",
    label: "월 순수익",
    values: results.value.map((app) => ({
      key: app.appKey,
      label: app.appName,
      value: app.netRevenue,
      highlight: app.appKey === bestApp.value?.appKey,
    })),
  },
]);

const bestAppSegments = computed(() => {
  const app = bestApp.value;
  if (!app) return [];
  return [
    { key: "commission", label: "중개 수수료", value: app.commission, tone: "fee" as const },
    { key: "payment", label: "결제 수수료", value: app.paymentFee, tone: "primary" as const },
    { key: "delivery", label: "배달대행료", value: app.deliveryFee, tone: "muted" as const },
  ];
});

const presets = [
  { label: "1.5만", value: 15_000 },
  { label: "2만", value: 20_000 },
  { label: "2.5만", value: 25_000 },
  { label: "3만", value: 30_000 },
];

const faqItems = [
  {
    q: "배달앱 수수료는 어떤 항목으로 구성되나요?",
    a: "일반적으로 중개수수료(광고·리스팅비), 결제수수료(PG 대행), 배달대행료 세 가지로 나뉩니다. 앱마다 명칭이 다르고 결제수수료가 중개수수료에 포함되기도 합니다.",
  },
  {
    q: "상생요금제 수수료는 모든 매장에 같은가요?",
    a: "아닙니다. 배달의민족과 쿠팡이츠의 중개수수료는 매출 구간 등에 따라 2.0~7.8%로 달라집니다. 이 계산기는 비교를 위해 6.8%를 대표값으로 사용합니다.",
  },
  {
    q: "배달대행료를 줄이는 방법이 있나요?",
    a: "자체배달 인력을 두거나, 픽업 주문 비중을 높이면 배달대행료를 절감할 수 있습니다. 또한 배달대행사마다 요금 체계가 다르므로 비교 후 계약하는 것이 좋습니다.",
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
</script>

<template>
  <SEOHead
    title="배달앱 수수료 비교 — 배민·쿠팡이츠·요기요 | shakilabs.com/biz"
    description="배달의민족, 쿠팡이츠, 요기요 수수료를 주문 금액과 건수 기준으로 비교합니다."
    :json-ld="faqJsonLd"
  />

  <div class="container py-6 sm:py-8 max-w-3xl">
    <h1 class="text-h1 font-bold text-foreground mb-1">배달앱 수수료 비교</h1>
    <p class="text-caption text-muted-foreground mb-6">
      주문 금액과 월 주문 건수로 배달앱별 수수료를 비교합니다.
    </p>

    <!-- 입력 -->
    <div class="retro-panel p-4 sm:p-5 space-y-4 mb-6">
      <div>
        <label class="block text-caption font-semibold text-foreground mb-1.5">건당 주문 금액</label>
        <div class="flex gap-2 flex-wrap mb-2">
          <button
            v-for="p in presets"
            :key="p.value"
            type="button"
            :class="[
              'px-3 py-1.5 rounded-md text-tiny font-medium border transition-colors',
              orderAmount === p.value
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-muted/50 text-muted-foreground border-border hover:border-primary/40',
            ]"
            @click="orderAmount = p.value"
          >
            {{ p.label }}
          </button>
        </div>
        <div class="relative">
          <input
            aria-label="건당 주문 금액"
            v-model="orderDisplay"
            type="text"
            inputmode="numeric"
            class="retro-input w-full pr-8"
          />
          <span class="absolute right-3 top-1/2 -translate-y-1/2 text-tiny text-muted-foreground">원</span>
        </div>
      </div>

      <div>
        <label class="block text-caption font-semibold text-foreground mb-1.5">
          월 주문 건수: {{ monthlyOrders.toLocaleString('ko-KR') }}건
        </label>
        <input
          aria-label="월 주문 건수 범위"
          v-model.number="monthlyOrders"
          type="range"
          min="50"
          max="3000"
          step="50"
          class="w-full accent-primary"
        />
        <div class="flex justify-between text-tiny text-muted-foreground">
          <span>50건</span>
          <span>3,000건</span>
        </div>
      </div>
    </div>

    <!-- 요약 -->
    <div v-if="bestApp" class="retro-panel p-4 sm:p-5 mb-4">
      <div class="text-center">
        <p class="text-caption text-muted-foreground mb-1">월 매출 {{ formatWon(totalRevenue) }} 기준</p>
        <span class="inline-block px-3 py-1 rounded-full text-caption font-bold bg-primary/15 text-primary">
          입력한 가정에서는 {{ bestApp.appName }} 총비용이 가장 적음
        </span>
      </div>
    </div>

    <div class="mb-6 grid gap-4">
      <MetricComparisonBars
        title="앱별 월 비용과 순수익"
        note="각 지표는 별도 기준으로 비교하며, 강조된 앱은 입력값에서 총비용이 가장 적습니다."
        :metrics="deliveryMetrics"
        :format-value="formatWon"
      />
      <BreakdownStackedBar
        v-if="bestApp"
        :title="`${bestApp.appName} 수수료 구성`"
        note="최저 비용 앱의 월 총 수수료를 항목별로 나눴습니다."
        :segments="bestAppSegments"
        :format-value="formatWon"
      />
    </div>

    <!-- 비교 테이블 -->
    <div class="retro-panel overflow-hidden mb-6">
      <div class="overflow-x-auto">
        <table aria-label="배달앱 수수료 비교" class="w-full text-tiny">
          <thead>
            <tr class="border-b border-border bg-muted/30">
              <th scope="col" class="text-left p-3 font-semibold text-foreground">배달앱</th>
              <th scope="col" class="text-right p-3 font-semibold text-foreground">중개 수수료</th>
              <th scope="col" class="text-right p-3 font-semibold text-foreground">결제 수수료</th>
              <th scope="col" class="text-right p-3 font-semibold text-foreground">배달대행</th>
              <th scope="col" class="text-right p-3 font-semibold text-foreground">총 수수료</th>
              <th scope="col" class="text-right p-3 font-semibold text-foreground">순수익</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="r in results"
              :key="r.appKey"
              :class="[
                'border-b border-border/50 transition-colors compare-hover-row',
                bestApp?.appKey === r.appKey ? 'bg-primary/5' : '',
              ]"
            >
              <td class="p-3">
                <div class="flex items-center gap-2">
                  <span class="inline-block h-2.5 w-2.5 shrink-0 rounded-full bg-muted-foreground/45" />
                  <span class="font-medium text-foreground">{{ r.appName }}</span>
                  <span
                    v-if="bestApp?.appKey === r.appKey"
                    class="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded"
                  >
                    최저
                  </span>
                </div>
              </td>
              <td class="text-right p-3 text-destructive">{{ formatWon(r.commission) }}</td>
              <td class="text-right p-3 text-destructive">{{ r.paymentFee > 0 ? formatWon(r.paymentFee) : '-' }}</td>
              <td class="text-right p-3 text-destructive">{{ formatWon(r.deliveryFee) }}</td>
              <td class="text-right p-3 font-semibold text-destructive">
                {{ formatWon(r.totalFee) }}
                <span class="block text-[10px] text-muted-foreground">({{ formatPercent(r.feeRate) }})</span>
              </td>
              <td class="text-right p-3 font-semibold text-foreground">{{ formatWon(r.netRevenue) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="retro-panel p-4 text-tiny text-muted-foreground space-y-1">
      <p class="font-semibold text-foreground">유의사항</p>
      <ul class="list-disc pl-4 space-y-0.5">
        <li>배달의민족·쿠팡이츠는 2.0~7.8% 차등 수수료 중 6.8%를 대표값으로 계산합니다.</li>
        <li>요기요는 상생안의 최대 인하폭을 반영한 7.8%를 비교 가정으로 사용합니다.</li>
        <li>결제수수료·배달대행료는 공개된 단일 확정값이 아닌 비교 가정입니다.</li>
        <li>배달대행료는 평균값이며, 거리·시간대에 따라 달라집니다.</li>
        <li>
          {{ BIZ_DATA_VERIFIED }} 확인 ·
          <a :href="DELIVERY_FEE_SOURCE_URL" target="_blank" rel="noopener noreferrer" class="retro-link">중소벤처기업부 상생방안</a>
        </li>
      </ul>
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
