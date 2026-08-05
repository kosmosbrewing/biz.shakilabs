<script setup lang="ts">
import { useSEO } from "@/composables/useSEO";

const props = defineProps<{
  title: string;
  description: string;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
  noindex?: boolean;
  /** 금액 변형 라우트의 canonical 통합 대상 경로 (useSEO 참고). */
  canonicalPath?: string;
}>();

useSEO({
  title: () => props.title,
  description: () => props.description,
  jsonLd: () => props.jsonLd,
  noindex: () => props.noindex,
  canonicalPath: () => props.canonicalPath,
});
</script>

<template>
</template>
