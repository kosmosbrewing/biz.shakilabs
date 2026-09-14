<script setup lang="ts">
// v3 §3.3-1 — 모바일(<48rem)은 헤더의 좌측 드로어가 대신한다.
// 링크는 드로어에 그대로 렌더되므로 크롤 경로는 유지된다(레시피 §3).
import { computed } from "vue";
import { RouterLink, useRoute } from "vue-router";
import { ShPrimaryNavigation } from "@shakilabs/ui";
import { BIZ_TOOLS } from "@/data/bizNavigation";

const route = useRoute();
const tabs = BIZ_TOOLS;

const activeItem = computed(() =>
  tabs.find((item) => route.path === item.to),
);
</script>

<template>
  <ShPrimaryNavigation
    class="tab-navigation--desktop-only"
    :items="tabs"
    :active-key="activeItem?.key"
    :link-component="RouterLink"
  />
</template>

<style scoped>
@media (max-width: 47.99rem) {
  .tab-navigation--desktop-only {
    display: none;
  }
}
</style>
