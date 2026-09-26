<script setup lang="ts">
// finance CalculatorMemoryControl·loan DsrMemoryControl과 같은 규약이다(새 패턴을 만들지 않는다).
// 저장소·TTL·키 규약은 패키지 ShMemoryControl이 소유한다:
// sessionStorage, 8시간, `shaki:draft:biz:individual-vs-corp:v1`.
// 두 앱은 입력이 URL에 있어 경로를 저장하지만, 이 계산기는 입력을 화면 상태로만 들고 있어
// 입력 세 값을 v-model로 받아 그대로 저장·복원한다.
import { onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { ShMemoryControl } from "@shakilabs/ui";
import { trackEvent } from "@/lib/analytics";
import { parseIndividualVsCorpMemory } from "@/lib/individualVsCorpMemory";

// 앱 자체 카드(BusinessSessionDraftControl) 시절의 키. 규약(shaki:draft:<category>:<tool>:v1)
// 밖이라 새 컨트롤은 읽지 않는다 — 이어받지 않고 지워서 탭에 옛 값이 남지 않게 한다.
const LEGACY_STORAGE_KEY = "biz:individual-vs-corp-session-draft:v1";

const revenue = defineModel<number>("revenue", { required: true });
const expenseRate = defineModel<number>("expenseRate", { required: true });
const corpSalary = defineModel<number>("corpSalary", { required: true });

type MemoryControlExposed = {
  save: (payload: unknown) => void;
  clear: () => void;
  markRestored: () => void;
};

const control = ref<MemoryControlExposed | null>(null);
const route = useRoute();
const tracking = ref(false);

// 금액 변형(/individual-vs-corp/:amount)은 링크가 매출을 정해 준 화면이다.
// 저장본이 그 값을 덮으면 사용자가 방금 연 화면이 사라지므로, 맨 경로로 들어왔을 때만 복원한다.
// (쿼리는 보지 않는다 — 이 앱은 입력을 쿼리에 싣지 않아 utm 등이 복원을 막을 이유가 없다)
const enteredBare = route.params.amount === undefined;

function saveCurrent(): void {
  // 복원 때와 같은 스키마로 거른다 — 되살릴 수 없는 값(범위 밖)은 적지 않는다
  const payload = parseIndividualVsCorpMemory({
    revenue: revenue.value,
    expenseRate: expenseRate.value,
    corpSalary: corpSalary.value,
    savedAt: Date.now(),
  });
  if (payload) control.value?.save(payload);
}

function ageBucket(savedAt: number): string {
  const age = Date.now() - savedAt;
  if (age < 15 * 60 * 1000) return "under_15m";
  if (age < 60 * 60 * 1000) return "under_1h";
  return "under_8h";
}

function handleEnable(): void {
  tracking.value = true;
  saveCurrent();
}

function handleDisable(): void {
  tracking.value = false;
}

function handleRestore(payload: unknown): void {
  tracking.value = true;
  const parsed = parseIndividualVsCorpMemory(payload);
  // 스키마 밖이면 되살리지 않고 버린다
  if (!parsed) {
    control.value?.clear();
    tracking.value = false;
    return;
  }
  // 링크로 들어온 금액 변형이면 화면 값을 저장본으로 덮지 않는다(저장본도 지우지 않는다)
  if (!enteredBare) return;
  revenue.value = parsed.revenue;
  expenseRate.value = parsed.expenseRate;
  corpSalary.value = parsed.corpSalary;
  // 실제로 되살리는 경우에만 "복원함" — 위에서 링크 값을 지키고 돌아간 경우는 "기억 중"으로 남는다(0.3.41)
  control.value?.markRestored();
  trackEvent("recent_result_open", {
    app_id: "biz",
    tool_id: "individual_vs_corp",
    // 값이 아니라 경과 구간만 보낸다 — 입력값은 분석 도구로 나가지 않는다
    age_bucket: ageBucket(parsed.savedAt),
  });
}

onMounted(() => {
  try {
    sessionStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    // 저장소 차단 브라우저 — 지울 것도 없다
  }
});

// 켜져 있는 동안 입력이 바뀔 때마다 최신 값으로 갱신한다
watch([revenue, expenseRate, corpSalary], () => {
  if (tracking.value) saveCurrent();
});
</script>

<template>
  <ShMemoryControl
    ref="control"
    category="biz"
    tool="individual-vs-corp"
    @enable="handleEnable"
    @disable="handleDisable"
    @restore="handleRestore"
  />
</template>
