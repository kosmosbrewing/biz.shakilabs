import { computed, onMounted, ref, watch } from "vue";
import { z } from "zod";
import { trackEvent } from "@/lib/analytics";
import { calcCorpAfterTax, calcIndividualAfterTax } from "@/utils/bizCalc";

const STORAGE_KEY = "biz:individual-vs-corp-session-draft:v1";
const DRAFT_TTL_MS = 8 * 60 * 60 * 1000;
const draftSchema = z.object({
  revenue: z.number().finite().min(0).max(100_000_000_000),
  expenseRate: z.number().finite().min(0.1).max(0.8),
  corpSalary: z.number().finite().min(0).max(10_000_000_000),
  savedAt: z.number().int().nonnegative(),
});

export type IndividualVsCorpDraft = z.infer<typeof draftSchema>;

export function parseIndividualVsCorpDraft(
  raw: string | null,
  now = Date.now(),
): IndividualVsCorpDraft | null {
  if (!raw) return null;

  try {
    const parsed = draftSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return null;
    if (parsed.data.savedAt < now - DRAFT_TTL_MS) return null;
    if (parsed.data.savedAt > now + 60_000) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

function ageBucket(savedAt: number): string {
  const age = Date.now() - savedAt;
  if (age < 15 * 60 * 1000) return "under_15m";
  if (age < 60 * 60 * 1000) return "under_1h";
  return "under_8h";
}

export function useIndividualVsCorp(initialRevenue?: number) {
  const revenue = ref(initialRevenue ?? 100_000_000);
  const expenseRate = ref(0.40);
  const corpSalary = ref(36_000_000);
  const storedDraft = ref<IndividualVsCorpDraft | null>(null);
  const draftLoaded = ref(false);
  const draftTracking = ref(false);

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

  function removeStoredDraft(): void {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // 브라우저 저장소 사용 불가 시 메모리 상태만 갱신
    }
  }

  function saveDraft(): void {
    const next = draftSchema.safeParse({
      revenue: revenue.value,
      expenseRate: expenseRate.value,
      corpSalary: corpSalary.value,
      savedAt: Date.now(),
    });
    if (!next.success) return;
    storedDraft.value = next.data;
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next.data));
    } catch {
      draftTracking.value = false;
    }
  }

  onMounted(() => {
    try {
      storedDraft.value = parseIndividualVsCorpDraft(sessionStorage.getItem(STORAGE_KEY));
    } catch {
      storedDraft.value = null;
    }
    if (!storedDraft.value) removeStoredDraft();
    draftLoaded.value = true;
  });

  watch([revenue, expenseRate, corpSalary], () => {
    if (draftLoaded.value && draftTracking.value) saveDraft();
  });

  function enableDraft(): void {
    draftTracking.value = true;
    saveDraft();
  }

  function restoreDraft(): void {
    if (!storedDraft.value) return;
    const draft = storedDraft.value;
    revenue.value = draft.revenue;
    expenseRate.value = draft.expenseRate;
    corpSalary.value = draft.corpSalary;
    draftTracking.value = true;
    trackEvent("recent_result_open", {
      app_id: "biz",
      tool_id: "individual_vs_corp",
      age_bucket: ageBucket(draft.savedAt),
    });
  }

  function clearDraft(): void {
    draftTracking.value = false;
    storedDraft.value = null;
    removeStoredDraft();
  }

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
    draftLoaded,
    draftTracking,
    hasRestorableDraft: computed(() => Boolean(storedDraft.value && !draftTracking.value)),
    enableDraft,
    restoreDraft,
    clearDraft,
  };
}
