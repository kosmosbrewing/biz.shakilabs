<script setup lang="ts">
import { ref, onBeforeUnmount } from "vue";
import { Copy, Check } from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import { copyToClipboard } from "@/lib/routeState";

const props = defineProps<{
  headers: string[];
  rows: string[][];
}>();

const copied = ref(false);
let timer: ReturnType<typeof setTimeout> | null = null;

function formatTsv(): string {
  const lines = [props.headers.join("\t")];
  for (const row of props.rows) {
    lines.push(row.join("\t"));
  }
  return lines.join("\n");
}

async function handleCopy() {
  const ok = await copyToClipboard(formatTsv());
  if (!ok) return;

  copied.value = true;
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    copied.value = false;
  }, 2000);
}

onBeforeUnmount(() => {
  if (timer) clearTimeout(timer);
});
</script>

<template>
  <Button
    type="button"
    variant="outline"
    class="h-6 min-h-0 gap-0.5 rounded-lg px-1.5 text-[11px] leading-none"
    :class="copied ? '!border-profit/50 !text-profit' : ''"
    @click="handleCopy"
  >
    <component :is="copied ? Check : Copy" class="h-2.5 w-2.5" />
    {{ copied ? "복사됨" : "복사" }}
  </Button>
</template>
