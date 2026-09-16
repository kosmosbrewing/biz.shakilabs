<script setup lang="ts">
// v3 3.2 - 0.3.24부터 헤더가 로고/회전 안내/사이트 링크+테마 토글 3열이다. 팁은
// 헤더 밖 얇은 배너가 아니라 패키지의 #tip 슬롯(흐름 밖 절대 배치)에 실려
// 문구 길이가 바뀌어도 56px 헤더 높이가 흔들리지 않는다.
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
    <template #tip>
      <TickerBar :key="route.path" :messages="tickerMessages" />
    </template>

    <template #utility>
      <ThemeToggle />
    </template>
  </ShGlobalHeader>
</template>
