<script setup lang="ts">
// 결과 히어로 — 전 앱 공통 문법(라벨 위 → 금액 text-display/브랜드색 → 보조 muted)을
// biz 로컬로 구현한다. 패키지 승격(0.3.14 ShResultHero) 시 얇은 래퍼로 대체 예정.
defineProps<{
  label: string;
  value: string;
  sub?: string;
  /** 이미 흰 카드 안에 렌더될 때 패널 크롬을 생략한다 */
  flat?: boolean;
}>();
</script>

<template>
  <div :class="flat ? 'text-center' : 'retro-panel px-4 py-5 text-center'">
    <p class="text-caption text-muted-foreground">{{ label }}</p>
    <p class="mt-1 text-display font-bold text-primary tabular-nums">{{ value }}</p>
    <p v-if="sub" class="mt-1 text-caption text-muted-foreground">{{ sub }}</p>
    <slot />
  </div>
</template>
