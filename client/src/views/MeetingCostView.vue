<script setup lang="ts">
import { computed, ref } from "vue";
import FreshBadge from "@/components/common/FreshBadge.vue";
import SEOHead from "@/components/common/SEOHead.vue";
import { BIZ_SERVICE_UPDATED_AT } from "@/data/bizExpansionData";
import { formatWon } from "@/lib/utils";
import { calculateMeetingCost } from "@/utils/bizExpansionCalc";

const seoTitle = "회의 비용 계산기 | 인원·빈도 기준 연간 예산";
const seoDescription = "회의 참석 인원과 1인당 비용을 기준으로 월간·연간 회의 비용과 매입세액 가능액을 계산합니다.";

const attendees = ref(6);
const costPerPerson = ref(30_000);
const meetingsPerMonth = ref(4);
const months = ref(12);
const vatIncluded = ref(true);

const result = computed(() => calculateMeetingCost({
  attendees: attendees.value,
  costPerPerson: costPerPerson.value,
  meetingsPerMonth: meetingsPerMonth.value,
  months: months.value,
  vatIncluded: vatIncluded.value,
}));
</script>

<template>
  <SEOHead :title="seoTitle" :description="seoDescription" />

  <div class="container space-y-5 py-5 max-w-4xl">
    <div class="retro-panel overflow-hidden">
      <div class="retro-titlebar rounded-t-2xl">
        <h1 class="retro-title">회의 비용 계산기</h1>
        <FreshBadge :message="`${BIZ_SERVICE_UPDATED_AT} 기준`" />
      </div>
      <div class="retro-panel-content grid gap-3 md:grid-cols-3">
        <input v-model.number="attendees" type="number" min="2" class="retro-input" placeholder="참석 인원" />
        <input v-model.number="costPerPerson" type="number" min="5000" class="retro-input" placeholder="1인당 비용" />
        <input v-model.number="meetingsPerMonth" type="number" min="1" class="retro-input" placeholder="월 회의 횟수" />
        <input v-model.number="months" type="number" min="1" max="12" class="retro-input" placeholder="개월 수" />
        <label class="retro-panel-muted flex items-center gap-2 px-3 py-3 text-caption font-semibold text-foreground md:col-span-2">
          <input v-model="vatIncluded" type="checkbox" class="h-4 w-4 rounded border-border" />
          부가세 포함 영수증 기준
        </label>
      </div>
    </div>

    <div class="grid gap-3 md:grid-cols-3">
      <div class="retro-panel-muted px-4 py-4">
        <p class="text-tiny text-muted-foreground">1회 회의 비용</p>
        <p class="mt-2 text-h2 font-bold text-foreground">{{ formatWon(result.perMeeting) }}</p>
      </div>
      <div class="retro-panel-muted px-4 py-4">
        <p class="text-tiny text-muted-foreground">연간 총예산</p>
        <p class="mt-2 text-h2 font-bold text-primary">{{ formatWon(result.annualBudget) }}</p>
      </div>
      <div class="retro-panel-muted px-4 py-4">
        <p class="text-tiny text-muted-foreground">예상 매입세액</p>
        <p class="mt-2 text-h2 font-bold text-foreground">{{ formatWon(result.vatCredit) }}</p>
      </div>
    </div>

    <div class="retro-panel px-4 py-4 text-caption text-foreground">
      참석자 1인당 연간 부담액은 약 {{ formatWon(result.annualPerPerson) }}입니다.
    </div>
  </div>
</template>
