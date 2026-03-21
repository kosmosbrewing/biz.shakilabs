<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount, nextTick, watch } from "vue";
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

const scrollEl = ref<HTMLElement | null>(null);
const showLeftFade = ref(false);
const showRightFade = ref(false);

function checkScroll() {
  const el = scrollEl.value;
  if (!el) return;
  showLeftFade.value = el.scrollLeft > 8;
  showRightFade.value = el.scrollWidth - el.scrollLeft - el.clientWidth > 8;
}

onMounted(() => {
  const el = scrollEl.value;
  if (el) {
    el.addEventListener("scroll", checkScroll, { passive: true });
    checkScroll();
  }
  window.addEventListener("resize", checkScroll);
});

onBeforeUnmount(() => {
  scrollEl.value?.removeEventListener("scroll", checkScroll);
  window.removeEventListener("resize", checkScroll);
});

watch(
  () => route.path,
  async () => {
    await nextTick();
    checkScroll();
  },
  { immediate: true }
);
</script>

<template>
  <nav class="sticky top-0 z-50 border-b border-primary/20 bg-primary shadow-sm" aria-label="주요 메뉴">
    <div class="container relative px-3 py-1.5 sm:px-4 sm:py-0">
      <div
        ref="scrollEl"
        class="tab-scroll grid grid-cols-3 gap-x-1 gap-y-0.5 sm:flex sm:h-12 sm:items-center sm:gap-2 sm:overflow-x-auto sm:py-0"
      >
        <RouterLink
          v-for="tab in tabs"
          :key="tab.key"
          :to="tab.to"
          :aria-current="isActiveTab(tab.key) ? 'page' : undefined"
          :class="[
            'relative flex items-center justify-center rounded-lg px-1 py-2 text-center text-[0.7rem] font-medium leading-tight transition-colors duration-150',
            'sm:h-12 sm:shrink-0 sm:rounded-none sm:px-3 sm:py-0 sm:text-body sm:font-semibold',
            isActiveTab(tab.key)
              ? 'bg-white/20 font-semibold text-white sm:bg-transparent sm:text-white sm:shadow-none'
              : 'text-white/70 active:bg-white/10 sm:bg-transparent sm:hover:text-white',
          ]"
        >
          <span class="break-keep">{{ tab.label }}</span>
          <span
            v-if="isActiveTab(tab.key)"
            class="absolute inset-x-1 bottom-0 hidden h-[3px] rounded-full bg-white sm:block"
          />
        </RouterLink>
      </div>
      <div
        v-show="showLeftFade"
        class="pointer-events-none absolute left-0 top-0 hidden h-full w-10 bg-gradient-to-r from-primary to-transparent sm:block"
        aria-hidden="true"
      />
      <div
        v-show="showRightFade"
        class="pointer-events-none absolute right-0 top-0 hidden h-full w-10 bg-gradient-to-l from-primary to-transparent sm:block"
        aria-hidden="true"
      />
    </div>
  </nav>
</template>

<style scoped>
.tab-scroll {
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.tab-scroll::-webkit-scrollbar {
  display: none;
}
</style>
