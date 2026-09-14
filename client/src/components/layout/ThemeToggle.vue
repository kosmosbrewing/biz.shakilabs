<script setup lang="ts">
import { onMounted, ref } from "vue";
import { Moon, Sun } from "lucide-vue-next";

// 사이트 전역 테마 키 - 카테고리별로 나누지 않는다. index.html 부트스트랩
// 스크립트와 같은 키를 써야 앱을 넘나들 때도 테마가 유지된다.
const THEME_STORAGE_KEY = "shakilabs:theme:v1";
type ThemeMode = "light" | "dark";

const theme = ref<ThemeMode>("light");

function applyTheme(next: ThemeMode): void {
  theme.value = next;
  document.documentElement.classList.toggle("dark", next === "dark");
  document.documentElement.style.colorScheme = next;
  localStorage.setItem(THEME_STORAGE_KEY, next);
}

function toggleTheme(): void {
  applyTheme(theme.value === "dark" ? "light" : "dark");
}

onMounted(() => {
  theme.value = document.documentElement.classList.contains("dark") ? "dark" : "light";
});
</script>

<template>
  <button
    type="button"
    class="sh-global-header__link"
    :aria-label="theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'"
    @click="toggleTheme"
  >
    <Moon v-if="theme === 'dark'" class="h-4 w-4" aria-hidden="true" />
    <Sun v-else class="h-4 w-4" aria-hidden="true" />
  </button>
</template>
