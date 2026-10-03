<script setup lang="ts">
import { useSEO, type TitleKind } from "@/composables/useSEO";

const props = defineProps<{
  title: string;
  description: string;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
  noindex?: boolean;
  /** 금액 변형 라우트의 canonical 통합 대상 경로 (useSEO 참고). */
  canonicalPath?: string;
  /** 기본 "tool". 소개·약관·개인정보·404만 "site"로 넘긴다(useSEO 레시피 주석 참고). */
  titleKind?: TitleKind;
}>();

useSEO({
  title: () => props.title,
  description: () => props.description,
  jsonLd: () => props.jsonLd,
  noindex: () => props.noindex,
  canonicalPath: () => props.canonicalPath,
  titleKind: () => props.titleKind,
});
</script>

<template>
</template>
