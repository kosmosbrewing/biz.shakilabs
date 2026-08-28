<script setup lang="ts">
// 결과 히어로 — 전 앱 공통 문법(라벨 위 → 금액 text-display/브랜드색 → 보조 muted)을
// biz 로컬로 구현한다. 패키지 승격(0.3.14 ShResultHero) 시 얇은 래퍼로 대체 예정.
//
// 카운트업 정책(2026-08 복원): 히어로 금액 한 곳만 애니메이션한다.
// - SSR/SSG 산출물에는 항상 최종값이 정적으로 남는다(초기 ref = props.value →
//   하이드레이션 불일치 없음). 애니메이션은 onMounted 이후에만 시작한다.
// - 마운트 시 0→값, props 변경 시 현재 표시값→새 값으로 보간(중단 후 이어가기).
// - prefers-reduced-motion 이면 즉시 최종값.
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

function animateTo(from: number, target: string) {
  cancelAnimationFrame(rafId);
  const parsed = parseNum(target);
  // 숫자가 없거나 모션 축소 환경이면 즉시 최종값으로 스냅한다.
  if (
    !parsed ||
    parsed.num === from ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    displayValue.value = target;
    return;
  }
  const start = performance.now();
  const delta = parsed.num - from;
  const tick = (now: number) => {
    const t = Math.min((now - start) / DURATION_MS, 1);
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

onMounted(() => {
  animateTo(0, props.value);
  watch(
    () => props.value,
    (next) => {
      // 진행 중이던 애니메이션의 현재 표시값에서 이어간다.
      const current = parseNum(displayValue.value)?.num ?? 0;
      animateTo(current, next);
    },
  );
});

onBeforeUnmount(() => cancelAnimationFrame(rafId));
</script>

<template>
  <div :class="flat ? 'text-center' : 'retro-panel px-4 py-5 text-center'">
    <p class="text-caption text-muted-foreground">{{ label }}</p>
    <p class="mt-1 text-display font-bold text-primary tabular-nums">{{ displayValue }}</p>
    <p v-if="sub" class="mt-1 text-caption text-muted-foreground">{{ sub }}</p>
    <slot />
  </div>
</template>
