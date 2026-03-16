<script setup lang="ts">
import { computed } from "vue";
import { CheckCircle2 } from "lucide-vue-next";
import { useConstantsStore } from "@/stores/constants";

const props = defineProps<{
  message?: string;
}>();

const constantsStore = useConstantsStore();
const defaultMessage = computed(() => {
  const verified = constantsStore.feeDataVerified;
  return `${verified} 기준`;
});
</script>

<template>
  <span
    class="hidden shrink-0 items-center gap-1 whitespace-nowrap rounded-full border border-primary/35 bg-primary/10 px-2 py-1 text-[10px] font-bold leading-none text-primary md:inline-flex md:gap-1.5 md:px-2.5 md:text-[11px]"
  >
    <CheckCircle2 class="h-3.5 w-3.5" />
    {{ props.message ?? defaultMessage }}
  </span>
</template>
