<script setup lang="ts">
import { ShSurface, ShText } from "@shakilabs/ui";

defineProps<{
  loaded: boolean;
  tracking: boolean;
  hasRestorableDraft: boolean;
}>();

defineEmits<{
  enable: [];
  restore: [];
  clear: [];
}>();
</script>

<template>
  <ShSurface v-if="loaded" variant="outlined" padding="sm" class="flex flex-wrap items-center justify-between gap-3">
    <div>
      <ShText as="h2" variant="heading">이 탭에서 비교 입력 이어보기</ShText>
      <ShText variant="caption" tone="muted" class="mt-1">
        서버로 보내지 않고 이 탭에만 최대 8시간 기억합니다.
      </ShText>
    </div>
    <button v-if="hasRestorableDraft" type="button" class="retro-button" @click="$emit('restore')">
      저장 입력 불러오기
    </button>
    <button v-else-if="tracking" type="button" class="retro-button" @click="$emit('clear')">
      입력 기억 끄기
    </button>
    <button v-else type="button" class="retro-button" @click="$emit('enable')">
      입력 기억 켜기
    </button>
  </ShSurface>
</template>
