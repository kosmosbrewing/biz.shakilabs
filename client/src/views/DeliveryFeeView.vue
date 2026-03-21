<script setup lang="ts">
import { ref, computed } from "vue";
import SEOHead from "@/components/common/SEOHead.vue";
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

const presets = [
  { label: "1.5만", value: 15_000 },
  { label: "2만", value: 20_000 },
  { label: "2.5만", value: 25_000 },
  { label: "3만", value: 30_000 },
];
</script>

<template>
  <SEOHead
    title="배달앱 수수료 비교 — 배민·쿠팡이츠·요기요 | shakilabs.com/biz"
    description="배달의민족, 쿠팡이츠, 요기요 수수료를 주문 금액과 건수 기준으로 비교합니다."
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
          {{ bestApp.appName }}이 수수료 가장 적음
        </span>
      </div>
    </div>

    <!-- 비교 테이블 -->
    <div class="retro-panel overflow-hidden mb-6">
      <div class="overflow-x-auto">
        <table class="w-full text-tiny">
          <thead>
            <tr class="border-b border-border bg-muted/30">
              <th class="text-left p-3 font-semibold text-foreground">배달앱</th>
              <th class="text-right p-3 font-semibold text-foreground">중개 수수료</th>
              <th class="text-right p-3 font-semibold text-foreground">결제 수수료</th>
              <th class="text-right p-3 font-semibold text-foreground">배달대행</th>
              <th class="text-right p-3 font-semibold text-foreground">총 수수료</th>
              <th class="text-right p-3 font-semibold text-foreground">순수익</th>
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
                  <span
                    class="inline-block h-2.5 w-2.5 rounded-full shrink-0"
                    :style="{ backgroundColor: r.color }"
                  />
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
        <li>배달의민족 중개수수료는 오픈리스트 6.8% 기준이며, 울트라콜(월 88,000원) 별도입니다.</li>
        <li>쿠팡이츠·요기요는 중개수수료에 결제수수료가 포함되어 있습니다.</li>
        <li>배달대행료는 평균값이며, 거리·시간대에 따라 달라집니다.</li>
        <li>2026년 3월 기준 수수료이며, 변동될 수 있습니다.</li>
      </ul>
    </div>
  </div>
</template>
