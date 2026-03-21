<script setup lang="ts">
import { ref, computed } from "vue";
import SEOHead from "@/components/common/SEOHead.vue";
import { calcBreakEven } from "@/utils/bizBreakEvenCalc";
import { INDUSTRY_EXPENSE_RATIOS } from "@/data/bizConstants";
import { formatWon } from "@/lib/utils";

const industryKey = ref("food");
const rent = ref(1_500_000);
const labor = ref(2_000_000);
const otherFixed = ref(500_000);
const variableCostRate = ref(INDUSTRY_EXPENSE_RATIOS.food.variableRatio);
const operatingDays = ref(26);

const industries = Object.entries(INDUSTRY_EXPENSE_RATIOS).map(([key, val]) => ({
  key,
  label: val.label,
  variableRatio: val.variableRatio,
}));

function onIndustryChange(key: string): void {
  industryKey.value = key;
  const ratio = INDUSTRY_EXPENSE_RATIOS[key];
  if (ratio) variableCostRate.value = ratio.variableRatio;
}

const fixedCosts = computed(() => rent.value + labor.value + otherFixed.value);

const result = computed(() =>
  calcBreakEven(fixedCosts.value, variableCostRate.value, operatingDays.value),
);

function fmtInput(val: number): string {
  return val.toLocaleString("ko-KR");
}

function parseInput(v: string): number {
  return Number(v.replace(/[^0-9]/g, "")) || 0;
}
</script>

<template>
  <SEOHead
    title="소상공인 손익분기점(BEP) 계산기 | shakilabs.com/biz"
    description="고정비와 변동비를 입력하면 월 매출 손익분기점을 계산합니다."
  />

  <div class="container py-6 sm:py-8 max-w-3xl">
    <h1 class="text-h1 font-bold text-foreground mb-1">손익분기점 계산기</h1>
    <p class="text-caption text-muted-foreground mb-6">
      월 고정비와 변동비율로 BEP(Break-Even Point)를 계산합니다.
    </p>

    <!-- 입력 -->
    <div class="retro-panel p-4 sm:p-5 space-y-4 mb-6">
      <div>
        <label class="block text-caption font-semibold text-foreground mb-1.5">업종 선택</label>
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
            @click="onIndustryChange(ind.key)"
          >
            {{ ind.label }}
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label class="block text-tiny font-semibold text-foreground mb-1">월 임대료</label>
          <div class="relative">
            <input
              :value="fmtInput(rent)"
              type="text"
              inputmode="numeric"
              class="retro-input w-full pr-8"
              @input="rent = parseInput(($event.target as HTMLInputElement).value)"
            />
            <span class="absolute right-3 top-1/2 -translate-y-1/2 text-tiny text-muted-foreground">원</span>
          </div>
        </div>
        <div>
          <label class="block text-tiny font-semibold text-foreground mb-1">월 인건비</label>
          <div class="relative">
            <input
              :value="fmtInput(labor)"
              type="text"
              inputmode="numeric"
              class="retro-input w-full pr-8"
              @input="labor = parseInput(($event.target as HTMLInputElement).value)"
            />
            <span class="absolute right-3 top-1/2 -translate-y-1/2 text-tiny text-muted-foreground">원</span>
          </div>
        </div>
        <div>
          <label class="block text-tiny font-semibold text-foreground mb-1">기타 고정비</label>
          <div class="relative">
            <input
              :value="fmtInput(otherFixed)"
              type="text"
              inputmode="numeric"
              class="retro-input w-full pr-8"
              @input="otherFixed = parseInput(($event.target as HTMLInputElement).value)"
            />
            <span class="absolute right-3 top-1/2 -translate-y-1/2 text-tiny text-muted-foreground">원</span>
          </div>
        </div>
      </div>

      <div>
        <label class="block text-caption font-semibold text-foreground mb-1.5">
          변동비율: {{ (variableCostRate * 100).toFixed(0) }}%
          <span class="text-tiny text-muted-foreground font-normal ml-1">(재료비·포장비 등)</span>
        </label>
        <input
          v-model.number="variableCostRate"
          type="range"
          min="0.05"
          max="0.80"
          step="0.05"
          class="w-full accent-primary"
        />
      </div>

      <div>
        <label class="block text-caption font-semibold text-foreground mb-1.5">월 영업일수</label>
        <input
          v-model.number="operatingDays"
          type="number"
          min="1"
          max="31"
          class="retro-input w-24"
        />
      </div>
    </div>

    <!-- 결과 -->
    <div class="retro-panel p-4 sm:p-5 mb-6">
      <h2 class="text-heading font-semibold text-foreground mb-4 text-center">손익분기점</h2>

      <div class="grid grid-cols-3 gap-3 text-center mb-4">
        <div class="retro-stat">
          <p class="text-tiny text-muted-foreground">월 고정비</p>
          <p class="text-body font-bold text-foreground">{{ formatWon(fixedCosts) }}</p>
        </div>
        <div class="retro-stat">
          <p class="text-tiny text-muted-foreground">BEP 월 매출</p>
          <p class="text-body font-bold text-primary">{{ formatWon(result.breakEvenRevenue) }}</p>
        </div>
        <div class="retro-stat">
          <p class="text-tiny text-muted-foreground">BEP 일 매출</p>
          <p class="text-body font-bold text-foreground">{{ formatWon(result.dailyBreakEvenRevenue) }}</p>
        </div>
      </div>

      <div class="bg-muted/30 rounded-lg p-3 text-caption text-muted-foreground">
        <p>
          월 <strong class="text-foreground">{{ formatWon(fixedCosts) }}</strong>의 고정비와
          변동비율 <strong class="text-foreground">{{ (variableCostRate * 100).toFixed(0) }}%</strong> 기준,
          최소 월 <strong class="text-primary">{{ formatWon(result.breakEvenRevenue) }}</strong>
          (일 {{ formatWon(result.dailyBreakEvenRevenue) }})의 매출이 필요합니다.
        </p>
      </div>
    </div>

    <div class="retro-panel p-4 text-tiny text-muted-foreground space-y-1">
      <p class="font-semibold text-foreground">계산 방법</p>
      <p>BEP = 고정비 ÷ (1 - 변동비율)</p>
      <p>변동비율은 매출 대비 재료비·포장비·카드수수료 등의 비중입니다.</p>
    </div>
  </div>
</template>
