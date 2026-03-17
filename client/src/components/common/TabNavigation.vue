<script setup lang="ts">
import { computed } from "vue";
import { useRoute, RouterLink } from "vue-router";

const route = useRoute();

const tabs = [
  { key: "home", label: "홈", to: "/" },
  { key: "individual-vs-corp", label: "개인 vs 법인", to: "/individual-vs-corp" },
  { key: "break-even", label: "손익분기점", to: "/break-even" },
  { key: "vat-compare", label: "부가세 비교", to: "/vat-compare" },
  { key: "delivery-fee", label: "배달앱 수수료", to: "/delivery-fee" },
  { key: "corp-tax", label: "법인세 계산", to: "/corp-tax" },
  { key: "car-expense", label: "차량 경비", to: "/car-expense" },
  { key: "meeting-cost", label: "회의 비용", to: "/meeting-cost" },
] as const;

const activePath = computed(() => route.path);

function isActiveTab(key: (typeof tabs)[number]["key"]): boolean {
  const tab = tabs.find((t) => t.key === key);
  return tab ? activePath.value === tab.to : false;
}
</script>

<template>
  <nav class="sticky top-0 z-50 border-b border-primary/20 bg-primary shadow-sm" aria-label="주요 메뉴">
    <div class="container">
      <div class="flex h-12 items-center gap-1 overflow-x-auto sm:gap-2" style="scrollbar-width: none">
        <RouterLink
          v-for="tab in tabs"
          :key="tab.key"
          :to="tab.to"
          :aria-current="isActiveTab(tab.key) ? 'page' : undefined"
          :class="[
            'touch-target relative inline-flex h-12 shrink-0 items-center whitespace-nowrap px-2.5 text-caption font-semibold transition-all duration-200 sm:px-3 sm:text-body',
            isActiveTab(tab.key)
              ? 'text-white hover:text-white'
              : 'text-white/70 hover:text-white/90',
          ]"
        >
          {{ tab.label }}
          <span
            v-if="isActiveTab(tab.key)"
            class="absolute inset-x-1 bottom-0 h-[3px] rounded-full bg-white"
          />
        </RouterLink>
      </div>
    </div>
  </nav>
</template>
