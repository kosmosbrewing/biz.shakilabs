<script setup lang="ts">
import { computed } from "vue";
import { AlertTriangle, Loader2, MessageCircleOff } from "lucide-vue-next";

const props = withDefaults(
  defineProps<{
    type: "loading" | "empty" | "error";
    title?: string;
    description?: string;
  }>(),
  {
    title: "",
    description: "",
  }
);

const defaultTitle = computed(() => {
  if (props.type === "loading") return "수수료를 계산하는 중";
  if (props.type === "empty") return "비교할 데이터가 없어요";
  return "계산 중 문제가 발생했어요";
});

const defaultDescription = computed(() => {
  if (props.type === "loading") return "잠깐만 기다려주세요.";
  if (props.type === "empty") return "상품 정보를 입력해주세요.";
  return "입력값을 확인해주세요.";
});

const iconComponent = computed(() => {
  if (props.type === "loading") return Loader2;
  if (props.type === "empty") return MessageCircleOff;
  return AlertTriangle;
});

const iconClass = computed(() => {
  if (props.type === "loading") return "h-5 w-5 animate-spin text-muted-foreground";
  if (props.type === "empty") return "h-5 w-5 text-muted-foreground";
  return "h-5 w-5 text-status-danger";
});
</script>

<template>
  <div class="rounded-xl border border-border/60 bg-white px-3 py-4 text-center">
    <component :is="iconComponent" :class="iconClass" class="mx-auto" />
    <p class="mt-1 text-caption font-semibold text-foreground">{{ title || defaultTitle }}</p>
    <p class="mt-1 text-caption text-muted-foreground">{{ description || defaultDescription }}</p>
  </div>
</template>
