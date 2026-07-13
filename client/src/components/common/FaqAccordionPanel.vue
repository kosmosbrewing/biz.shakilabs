<script setup lang="ts">
import { useId } from "vue";
import { ChevronDown } from "lucide-vue-next";

interface FaqItem {
  q: string;
  a: string;
}

withDefaults(defineProps<{
  items: readonly FaqItem[];
  title?: string;
}>(), {
  title: "자주 묻는 질문",
});

const titleId = "faq-panel-" + useId();
</script>

<template>
  <section class="retro-panel overflow-hidden" :aria-labelledby="titleId">
    <div class="retro-titlebar rounded-t-2xl">
      <h2 :id="titleId" class="retro-title">{{ title }}</h2>
    </div>
    <div class="retro-panel-content space-y-3">
      <details v-for="item in items" :key="item.q" class="group retro-panel-muted p-4">
        <summary class="flex cursor-pointer list-none items-start justify-between gap-3 text-body font-semibold text-foreground">
          <span>{{ item.q }}</span>
          <ChevronDown aria-hidden="true" class="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
        </summary>
        <p class="mt-2 pr-6 text-caption leading-relaxed text-muted-foreground">{{ item.a }}</p>
      </details>
    </div>
  </section>
</template>
