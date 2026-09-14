<script setup lang="ts">
// v3 3.2 - GlobalHeader 내용은 로고 + 사이트 링크 + 테마 버튼뿐이다. 앱은 자체
// 헤더 마크업을 갖지 않는다. 티커(안내 문구)는 헤더 밖 얇은 배너로 내린다.
import { computed } from "vue";
import { useRoute } from "vue-router";
import { ShGlobalHeader } from "@shakilabs/ui";
import ThemeToggle from "@/components/layout/ThemeToggle.vue";
import TickerBar from "@/components/common/TickerBar.vue";
import { tickerMessages } from "@/data/tickerMessages";
import { BIZ_TOOLS } from "@/data/bizNavigation";

// 모바일 드로어(v3 §3.3-1)에 실을 도구 목록 — 2차 내비(BizTabNavigation)와 같은 출처를 쓴다.
const route = useRoute();
const navItems = BIZ_TOOLS;
const navActiveKey = computed(
  () => navItems.find((item) => route.path === item.to)?.key ?? "",
);
</script>

<template>
  <ShGlobalHeader
    home-href="/"
    brand="ShakiLabs"
    :nav-items="navItems"
    :nav-active-key="navActiveKey"
    nav-title="사업 도구"
  >
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
