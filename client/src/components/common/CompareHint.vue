<script setup lang="ts">
import { ref, computed, onBeforeUnmount, onMounted, useSlots, nextTick, watch } from "vue";
import { CircleHelp } from "lucide-vue-next";
import { buttonVariants } from "@/components/ui/button";

const props = defineProps<{
  tooltip?: string;
  condition?: string;
  compact?: boolean;
  wide?: boolean;
  extraWide?: boolean;
}>();

const slots = useSlots();

// 패널 크기: extraWide(26rem=416px) > wide(20rem=320px) > default(14rem=224px)
const isRich = computed(() => props.extraWide || props.wide || !!slots.default);
const panelSizeClass = computed(() => {
  if (props.extraWide) return "w-[26rem] px-4 py-3";
  if (props.wide || slots.default) return "w-80 px-3.5 py-3";
  return "w-56 px-3 py-2";
});

const isVisible = ref(false);
const pos = ref({ x: 0, y: 0 });
const showBelow = ref(false);
const buttonRef = ref<HTMLElement | null>(null);
const panelRef = ref<HTMLElement | null>(null);
let timer: ReturnType<typeof setTimeout> | null = null;

function setPosition(target: HTMLElement) {
  const rect = target.getBoundingClientRect();
  const rawW = props.extraWide ? 416 : isRich.value ? 320 : 224;
  const panelW = Math.min(rawW, window.innerWidth - 16);
  // 렌더된 패널이 있으면 실제 높이 사용, 없으면 추정
  const panelH = panelRef.value?.offsetHeight ?? (isRich.value ? 160 : 80);
  const spaceAbove = rect.top;
  showBelow.value = spaceAbove < panelH + 16;
  pos.value = {
    x: Math.max(8, Math.min(rect.left + rect.width / 2, window.innerWidth - panelW - 8)),
    y: showBelow.value ? rect.bottom + 8 : rect.top - 8,
  };
}

function showFromTarget(target: HTMLElement) {
  if (timer) clearTimeout(timer);
  setPosition(target);
  isVisible.value = true;
}

function show(event: Event) {
  const target = event.currentTarget;
  if (!(target instanceof HTMLElement)) return;
  showFromTarget(target);
}

function hideNow() {
  if (timer) clearTimeout(timer);
  isVisible.value = false;
}

function hide() {
  timer = setTimeout(() => {
    isVisible.value = false;
  }, 120);
}

function keep() {
  if (timer) clearTimeout(timer);
}

function toggle(event: MouseEvent) {
  const target = event.currentTarget;
  if (!(target instanceof HTMLElement)) return;
  if (isVisible.value) {
    hideNow();
    return;
  }
  showFromTarget(target);
}

function handleDocumentClick(event: MouseEvent) {
  const target = event.target;
  if (!(target instanceof Node)) return;
  if (buttonRef.value?.contains(target) || panelRef.value?.contains(target)) return;
  hideNow();
}

function handleViewportChange() {
  if (!isVisible.value || !buttonRef.value) return;
  setPosition(buttonRef.value);
}

// 패널 렌더 후 실제 높이로 위치 재보정
watch(isVisible, async (visible) => {
  if (visible && buttonRef.value) {
    await nextTick();
    setPosition(buttonRef.value);
  }
});

onMounted(() => {
  document.addEventListener("click", handleDocumentClick);
  window.addEventListener("resize", handleViewportChange);
  window.addEventListener("scroll", handleViewportChange, true);
});

onBeforeUnmount(() => {
  if (timer) clearTimeout(timer);
  document.removeEventListener("click", handleDocumentClick);
  window.removeEventListener("resize", handleViewportChange);
  window.removeEventListener("scroll", handleViewportChange, true);
});
</script>

<template>
  <span class="inline-flex shrink-0 align-middle">
    <button
      ref="buttonRef"
      type="button"
      :class="[buttonVariants({ variant: 'ghost', size: 'iconSm' }), 'rounded-full p-0 hover:bg-transparent', props.compact && '!h-auto !w-auto']"
      aria-label="상세 설명 보기"
      :aria-expanded="isVisible"
      @mouseenter="show"
      @mouseleave="hide"
      @focus="show"
      @blur="hide"
      @click.stop="toggle"
      @keydown.esc.prevent="hideNow"
    >
      <CircleHelp :class="props.compact ? 'h-3 w-3' : 'h-3.5 w-3.5'" />
    </button>

    <Teleport to="body">
      <Transition name="hint-fade">
        <div
          v-if="isVisible"
          ref="panelRef"
          class="fixed z-50 max-w-[calc(100vw-1rem)] rounded-lg border border-border/70 bg-popover text-[11px] leading-[1.45] text-popover-foreground shadow-lg"
          :class="panelSizeClass"
          :style="{ left: `${pos.x}px`, top: `${pos.y}px`, transform: showBelow ? 'translateY(0)' : 'translateY(-100%)' }"
          @mouseenter="keep"
          @mouseleave="hide"
          @click.stop
        >
          <slot v-if="slots.default" />
          <template v-else>
            <p v-if="tooltip">{{ tooltip }}</p>
            <p v-if="condition" class="mt-0.5 text-amber-700 dark:text-amber-300">
              {{ condition }}
            </p>
          </template>
        </div>
      </Transition>
    </Teleport>
  </span>
</template>

<style scoped>
.hint-fade-enter-active,
.hint-fade-leave-active {
  transition: opacity 0.12s ease;
}
.hint-fade-enter-from,
.hint-fade-leave-to {
  opacity: 0;
}
</style>
