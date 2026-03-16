<script setup lang="ts">
import { ref, computed } from "vue";
import SEOHead from "@/components/common/SEOHead.vue";
import { calcVatCompare } from "@/utils/bizCalc";
import { SIMPLIFIED_VAT_RATES } from "@/data/bizConstants";
import { formatWon } from "@/lib/utils";

const annualRevenue = ref(80_000_000);
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

const result = computed(() =>
  calcVatCompare(annualRevenue.value, industryKey.value, purchaseRate.value),
);

const presets = [
  { label: "3천만", value: 30_000_000 },
  { label: "5천만", value: 50_000_000 },
  { label: "8천만", value: 80_000_000 },
  { label: "1억", value: 100_000_000 },
];
</script>

<template>
  <SEOHead
    title="간이과세 vs 일반과세 부가세 비교 | biz.shakilabs.com"
    description="연 매출 기준, 간이과세와 일반과세 중 어느 쪽이 부가세가 적은지 비교합니다."
  />

  <div class="container py-6 sm:py-8 max-w-3xl">
    <h1 class="text-h1 font-bold text-foreground mb-1">간이과세 vs 일반과세</h1>
    <p class="text-caption text-muted-foreground mb-6">
      연 매출과 업종으로 부가가치세 차이를 비교합니다.
    </p>

    <!-- 입력 -->
    <div class="retro-panel p-4 sm:p-5 space-y-4 mb-6">
      <div>
        <label class="block text-caption font-semibold text-foreground mb-1.5">연 매출액 (공급가액 기준)</label>
        <div class="flex gap-2 flex-wrap mb-2">
          <button
            v-for="p in presets"
            :key="p.value"
            type="button"
            :class="[
              'px-3 py-1.5 rounded-md text-tiny font-medium border transition-colors',
              annualRevenue === p.value
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-muted/50 text-muted-foreground border-border hover:border-primary/40',
            ]"
            @click="annualRevenue = p.value"
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
        <label class="block text-caption font-semibold text-foreground mb-1.5">업종</label>
        <div class="flex gap-2 flex-wrap">
          <button
            v-for="ind in industries"
            :key="ind.key"
            type="button"
            :class="[
              'px-3 py-1.5 rounded-md text-tiny font-medium border transition-colors',
              industryKey === ind.key
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-muted/50 text-muted-foreground border-border hover:border-primary/40',
            ]"
            @click="industryKey = ind.key"
          >
            {{ ind.label }}
            <span class="ml-1 opacity-70">({{ (ind.rate * 100).toFixed(0) }}%)</span>
          </button>
        </div>
      </div>

      <div>
        <label class="block text-caption font-semibold text-foreground mb-1.5">
          매입 비율: {{ (purchaseRate * 100).toFixed(0) }}%
          <span class="text-tiny text-muted-foreground font-normal ml-1">(세금계산서 매입분)</span>
        </label>
        <input
          v-model.number="purchaseRate"
          type="range"
          min="0.05"
          max="0.80"
          step="0.05"
          class="w-full accent-primary"
        />
      </div>
    </div>

    <!-- 결과 -->
    <div class="retro-panel p-4 sm:p-5 mb-6">
      <!-- 간이과세 적격 여부 -->
      <div v-if="!result.isSimplifiedEligible" class="mb-4 rounded-lg bg-destructive/10 p-3 text-caption text-destructive font-medium">
        연 매출 1억 800만원 이상으로 간이과세 적용이 불가합니다. 일반과세만 가능합니다.
      </div>

      <div v-if="result.isSimplifiedExempt && result.isSimplifiedEligible" class="mb-4 rounded-lg bg-primary/10 p-3 text-caption text-primary font-medium">
        연 매출 4,800만원 미만 — 간이과세 납부 면제 대상입니다.
      </div>

      <div class="text-center mb-4">
        <span
          v-if="result.isSimplifiedEligible"
          :class="[
            'inline-block px-3 py-1 rounded-full text-caption font-bold',
            result.recommendation === 'simplified'
              ? 'bg-primary/15 text-primary'
              : 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
          ]"
        >
          {{ result.recommendation === 'simplified' ? '간이과세' : '일반과세' }}가
          {{ formatWon(Math.abs(result.difference)) }} 유리
        </span>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div class="text-center space-y-2">
          <h3 class="text-caption font-bold text-blue-600 dark:text-blue-400">일반과세</h3>
          <p class="text-h1 font-bold text-foreground">{{ formatWon(result.generalVat) }}</p>
          <p class="text-tiny text-muted-foreground">연간 부가세</p>
        </div>
        <div class="text-center space-y-2">
          <h3 class="text-caption font-bold text-primary">간이과세</h3>
          <p class="text-h1 font-bold text-foreground">
            {{ result.isSimplifiedEligible ? formatWon(result.simplifiedVat) : '-' }}
          </p>
          <p class="text-tiny text-muted-foreground">
            {{ result.isSimplifiedExempt ? '납부 면제' : '연간 부가세' }}
          </p>
        </div>
      </div>
    </div>

    <div class="retro-panel p-4 text-tiny text-muted-foreground space-y-1">
      <p class="font-semibold text-foreground">과세 유형 기준 (2026년)</p>
      <ul class="list-disc pl-4 space-y-0.5">
        <li>간이과세: 연 매출 1억 800만원 미만 (부동산임대·유흥업 제외 시 4,800만원 미만 납부 면제)</li>
        <li>일반과세: 부가세 = 매출세액(10%) - 매입세액</li>
        <li>간이과세: 부가세 = 매출액 × 업종별 부가가치율 × 10%</li>
      </ul>
    </div>
  </div>
</template>
