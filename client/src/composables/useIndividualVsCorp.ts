import { computed, ref } from "vue";
import { calcCorpAfterTax, calcIndividualAfterTax } from "@/utils/bizCalc";

// 입력 기억(저장·복원)은 IndividualVsCorpMemoryControl이 패키지 ShMemoryControl 규약으로 맡는다 —
// 이 컴포저블은 입력 상태와 계산만 갖는다.
export function useIndividualVsCorp(initialRevenue?: number) {
  const revenue = ref(initialRevenue ?? 100_000_000);
  const expenseRate = ref(0.40);
  const corpSalary = ref(36_000_000);

  const revenueDisplay = computed({
    get: () => revenue.value.toLocaleString("ko-KR"),
    set: (value: string) => {
      const parsed = Number(value.replace(/[^0-9]/g, ""));
      if (Number.isFinite(parsed)) revenue.value = parsed;
    },
  });

  const corpSalaryDisplay = computed({
    get: () => corpSalary.value.toLocaleString("ko-KR"),
    set: (value: string) => {
      const parsed = Number(value.replace(/[^0-9]/g, ""));
      if (Number.isFinite(parsed)) corpSalary.value = parsed;
    },
  });

  const individual = computed(() => calcIndividualAfterTax(revenue.value, expenseRate.value));
  const corp = computed(() => calcCorpAfterTax(revenue.value, expenseRate.value, corpSalary.value));
  const difference = computed(() => corp.value.afterTaxIncome - individual.value.afterTaxIncome);
  const betterOption = computed(() => difference.value > 0 ? "법인" : difference.value < 0 ? "개인" : "동일");

  return {
    revenue,
    expenseRate,
    corpSalary,
    revenueDisplay,
    corpSalaryDisplay,
    individual,
    corp,
    difference,
    betterOption,
  };
}
