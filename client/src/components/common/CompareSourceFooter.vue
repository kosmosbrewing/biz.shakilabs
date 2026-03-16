<script setup lang="ts">
import { BookOpen, ExternalLink } from "lucide-vue-next";

defineProps<{
  sources: Array<{
    name: string;
    url: string;
    basis: string;
  }>;
  updatedAt: string;
}>();
</script>

<template>
  <div
    class="rounded-2xl border border-border/60 bg-muted/30 px-3.5 py-3 text-[10px] leading-4 text-foreground/90 dark:border-border/70 dark:bg-muted/20 sm:px-4 sm:text-caption"
  >
    <div class="flex flex-wrap items-center gap-1.5">
      <BookOpen class="h-4 w-4 shrink-0 text-muted-foreground" />
      <p class="font-semibold text-foreground">출처 및 기준</p>
      <span class="text-muted-foreground">· {{ updatedAt }} 확인</span>
    </div>

    <div class="mt-2 h-px bg-border/60" />

    <ul class="mt-2.5 space-y-1.5">
      <li
        v-for="source in sources"
        :key="`${source.name}-${source.basis}`"
        class="flex items-start gap-1.5"
      >
        <span class="pt-0.5 text-muted-foreground">•</span>
        <div class="min-w-0">
          <span class="font-medium text-foreground">{{ source.name }}</span>
          <span class="mx-1 text-muted-foreground">—</span>
          <a
            :href="source.url"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-1 text-primary underline underline-offset-2"
          >
            <span>{{ source.basis }}</span>
            <ExternalLink class="h-3 w-3 shrink-0" />
          </a>
        </div>
      </li>
    </ul>

    <p class="mt-2.5 text-muted-foreground">
      ※ 요금·수수료는 변동 가능하며, 정확한 금액은 각 서비스에서 확인하세요.
    </p>
  </div>
</template>
