<script setup lang="ts">
import { computed } from "vue";
import { RouterLink, useRoute } from "vue-router";
import {
  ShPrimaryNavigation,
  type PrimaryNavigationItem,
} from "@shakilabs/ui";

const route = useRoute();
const tabs: readonly PrimaryNavigationItem[] = [
  { key: "home", label: "사업 도구", to: "/", href: "/biz" },
  { key: "individual-vs-corp", label: "개인 vs 법인", to: "/individual-vs-corp" },
  { key: "break-even", label: "손익분기점", to: "/break-even" },
  { key: "vat-compare", label: "부가세 비교", to: "/vat-compare" },
  { key: "delivery-fee", label: "배달앱 수수료", to: "/delivery-fee" },
  { key: "corp-tax", label: "법인세 계산", to: "/corp-tax" },
  { key: "car-expense", label: "차량 경비", to: "/car-expense" },
  { key: "meeting-cost", label: "회의 비용", to: "/meeting-cost" },
];

const activeItem = computed(() =>
  tabs.find((item) => route.path === item.to),
);
</script>

<template>
  <ShPrimaryNavigation
    :items="tabs"
    :active-key="activeItem?.key"
    :link-component="RouterLink"
  />
</template>
