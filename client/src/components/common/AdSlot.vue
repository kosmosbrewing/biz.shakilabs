<script setup lang="ts">
import { computed, onMounted } from "vue";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

const props = defineProps<{
  slot: string;
  label?: string;
}>();

const publisherId = (import.meta.env.VITE_ADSENSE_PUBLISHER_ID || "").trim();
const isDev = import.meta.env.DEV;
const slotAliasMap: Record<string, string> = {
  top: (import.meta.env.VITE_ADSENSE_SLOT_TOP || "").trim(),
  bottom: (import.meta.env.VITE_ADSENSE_SLOT_BOTTOM || "").trim(),
  "market-compare": (import.meta.env.VITE_ADSENSE_SLOT_MARKET_COMPARE || "").trim(),
  "payment-compare": (import.meta.env.VITE_ADSENSE_SLOT_PAYMENT_COMPARE || "").trim(),
  "shipping-compare": (import.meta.env.VITE_ADSENSE_SLOT_SHIPPING_COMPARE || "").trim(),
};
const resolvedSlot = computed(() => slotAliasMap[props.slot]?.trim() || props.slot.trim());
const canRenderRealAd = computed(() => Boolean(publisherId && resolvedSlot.value));

function ensureAdsenseScript(): void {
  if (!publisherId) return;

  const existing = document.querySelector('script[data-adsense="true"]');
  if (existing) return;

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${publisherId}`;
  script.crossOrigin = "anonymous";
  script.dataset.adsense = "true";
  document.head.appendChild(script);
}

onMounted(() => {
  if (!canRenderRealAd.value) return;

  ensureAdsenseScript();

  try {
    (window.adsbygoogle = window.adsbygoogle || []).push({});
  } catch {
    // no-op
  }
});
</script>

<template>
  <section v-if="publisherId || isDev" class="retro-panel p-3">
    <p class="mb-2 text-caption text-muted-foreground">
      {{ label || "광고 영역" }}
    </p>

    <div v-if="canRenderRealAd" class="min-h-[80px]">
      <ins
        class="adsbygoogle"
        style="display:block"
        :data-ad-client="publisherId"
        :data-ad-slot="resolvedSlot"
        data-ad-format="auto"
        data-full-width-responsive="true"
      ></ins>
    </div>

    <div v-else-if="isDev" class="flex min-h-[80px] items-center justify-center border border-dashed border-border/60 rounded-lg text-caption text-muted-foreground">
      광고 영역 (개발 모드{{ resolvedSlot ? ` · slot ${resolvedSlot}` : "" }})
    </div>
  </section>
</template>
