<script setup lang="ts">
// 결과 히어로 — 전 앱 공통 문법(라벨 위 → 금액 text-display/브랜드색 → 보조 muted)을
// biz 로컬로 구현한다. 패키지 승격(0.3.14 ShResultHero) 시 얇은 래퍼로 대체 예정.
//
// 카운트업 정책(finance ResultHero.vue가 참조 구현):
// - 트리거는 두 가지다. (1) 페이지 로드 1회(0에서 시작) (2) 포맷된 문자열이 바뀔 때.
//   테마 토글·리사이즈·같은 값으로 끝나는 재계산에는 재실행하지 않는다.
// - 초기 displayValue = props.value(최종값)이므로 프리렌더/SSG HTML과 첫 렌더 모두
//   최종값을 보여준다(0 아님). 로드 카운트업은 값이 조용해진 뒤(SETTLE_MS) 시작한다.
// - 값 변경 애니메이션은 0이 아니라 현재 표시값에서 이어간다.
// - prefers-reduced-motion이면 즉시 최종값.
//
// BL-020에서 마운트 애니메이션을 뺐던 이유는 하이드레이션 직후 재계산이 끼어들어
// `-121,973원`·`+-13,841원` 같은 프레임이 스쳤기 때문이다. 재현해 보니 진짜 원인은
// **rAF 진행도에 하한이 없던 것**이었다(아래 tick() 주석). 그래서 금지 대신 고쳤다.
import { onBeforeUnmount, onMounted, ref, watch } from "vue";

const props = defineProps<{
  label: string;
  value: string;
  sub?: string;
  /** 이미 흰 카드 안에 렌더될 때 패널 크롬을 생략한다 */
  flat?: boolean;
}>();

const DURATION_MS = 750;
// 포맷된 문자열("1,234,000원")에서 첫 숫자 토큰만 보간 대상으로 삼는다.
const NUM_RE = /-?\d[\d,]*(?:\.\d+)?/;

const displayValue = ref(props.value);
let rafId = 0;

function parseNum(text: string): { num: number; decimals: number } | null {
  const m = text.match(NUM_RE);
  if (!m) return null;
  const raw = m[0].replace(/,/g, "");
  const num = Number(raw);
  if (!Number.isFinite(num)) return null;
  const decimals = raw.includes(".") ? raw.split(".")[1].length : 0;
  return { num, decimals };
}

function formatLike(template: string, n: number, decimals: number): string {
  const grouped = template.match(NUM_RE)?.[0].includes(",") ?? false;
  const formatted = n.toLocaleString("ko-KR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    useGrouping: grouped,
  });
  return template.replace(NUM_RE, formatted);
}

function prefersReducedMotion(): boolean {
  // SSG 프리렌더에는 window가 없다 — 그때는 애니메이션하지 않는다.
  return (
    typeof window === "undefined" ||
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true
  );
}

function animateTo(from: number, target: string) {
  cancelAnimationFrame(rafId);
  const parsed = parseNum(target);
  // 숫자가 없거나 모션 축소 환경이면 즉시 최종값으로 스냅한다.
  if (
    !parsed ||
    parsed.num === from ||
    prefersReducedMotion()
  ) {
    displayValue.value = target;
    return;
  }
  const start = performance.now();
  const delta = parsed.num - from;
  const tick = (now: number) => {
    // rAF 콜백의 타임스탬프는 **프레임 시작 시각**이라 직전에 찍은 performance.now()보다
    // 이를 수 있다. 하한을 안 걸면 t가 음수가 되고 ease-out 곡선이 음수를 돌려줘
    // 첫 프레임에 부호가 뒤집힌 값(`+-13,841원`)이 스친다(실측으로 확인).
    const t = Math.min(Math.max((now - start) / DURATION_MS, 0), 1);
    if (t >= 1) {
      displayValue.value = target;
      return;
    }
    const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
    displayValue.value = formatLike(target, from + delta * eased, parsed.decimals);
    rafId = requestAnimationFrame(tick);
  };
  rafId = requestAnimationFrame(tick);
}

// 로드할 때마다 0에서 올라온다.
//
// 값이 확정되기 전에 시작하면 과도 값을 향해 달려간다 — 하이드레이션 직후 한 번 더
// 계산하는 라우트가 있기 때문이다. 그래서 **값이 조용해진 뒤에** 센다. 값이 바뀔 때마다
// 타이머를 다시 걸고 SETTLE_MS 동안 변화가 없으면 그때 0에서 최종값으로 한 번 센다.
// 그 전까지는 애니메이션 없이 즉시 표시해 과도 값이 화면에 머물지 않게 한다.
const SETTLE_MS = 220;
let loadAnimationDone = false;
let settleTimer: ReturnType<typeof setTimeout> | null = null;

function clearSettleTimer(): void {
  if (settleTimer !== null) {
    clearTimeout(settleTimer);
    settleTimer = null;
  }
}

function armLoadAnimation(): void {
  clearSettleTimer();
  settleTimer = setTimeout(() => {
    settleTimer = null;
    if (loadAnimationDone) return;
    loadAnimationDone = true;
    if (!parseNum(props.value)) return;
    animateTo(0, props.value);
  }, SETTLE_MS);
}

onMounted(() => {
  if (prefersReducedMotion()) {
    loadAnimationDone = true;
    return;
  }
  armLoadAnimation();
});

watch(
  () => props.value,
  (next, previous) => {
    // 같은 포맷 문자열 = 화면상 변화 없음 = 애니메이션 없음.
    if (next === previous) return;
    if (!loadAnimationDone) {
      // 아직 값이 확정되지 않았다. 과도 값을 향해 세지 않고 즉시 표시만 하고,
      // 조용해질 때까지 로드 애니메이션을 미룬다.
      cancelAnimationFrame(rafId);
      displayValue.value = next;
      armLoadAnimation();
      return;
    }
    const current = parseNum(displayValue.value)?.num ?? 0;
    animateTo(current, next);
  },
);

onBeforeUnmount(() => {
  cancelAnimationFrame(rafId);
  clearSettleTimer();
});
</script>

<template>
  <div :class="flat ? 'text-center' : 'retro-panel px-4 py-5 text-center'">
    <p class="text-caption text-muted-foreground">{{ label }}</p>
    <p class="mt-1 text-display font-bold font-brand text-primary tabular-nums">{{ displayValue }}</p>
    <p v-if="sub" class="mt-1 text-caption text-muted-foreground">{{ sub }}</p>
    <slot />
  </div>
</template>
