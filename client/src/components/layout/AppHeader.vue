<script setup lang="ts">
// v3 3.2 - GlobalHeader 내용은 로고 + 사이트 링크 + 테마 버튼뿐이다. 앱은 자체
// 헤더 마크업을 갖지 않는다. 티커(안내 문구)는 헤더 밖 얇은 배너로 내린다.
import { ShGlobalHeader } from "@shakilabs/ui";
import ThemeToggle from "@/components/layout/ThemeToggle.vue";
import TickerBar from "@/components/common/TickerBar.vue";
import { tickerMessages } from "@/data/tickerMessages";
</script>

<template>
  <ShGlobalHeader home-href="/" brand="ShakiLabs">
    <template #utility>
      <ThemeToggle />
    </template>
  </ShGlobalHeader>
  <div class="border-b border-border bg-background">
    <div class="container flex min-h-7 items-center justify-center px-3 py-1 text-center sm:px-4">
      <TickerBar :messages="tickerMessages" />
    </div>
  </div>
</template>
