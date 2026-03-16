import { computed, ref } from "vue";
import { defineStore } from "pinia";
import { fetchPublicConstants, isRemoteConstantsEnabled } from "@/lib/api";
import { DEFAULT_SITE_URL } from "@/lib/site";
import { BIZ_DATA_UPDATED, BIZ_DATA_VERIFIED } from "@/data/bizConstants";
import type { PublicConstants } from "@/types/api";

const fallbackConstants: PublicConstants = {
  siteUrl: DEFAULT_SITE_URL,
  feeDataUpdated: BIZ_DATA_UPDATED,
  feeDataVerified: BIZ_DATA_VERIFIED,
  supportEmail: "skdba1313@gmail.com",
};

export const useConstantsStore = defineStore("constants", () => {
  const constants = ref<PublicConstants>(fallbackConstants);
  const isLoading = ref(false);
  const isLoaded = ref(false);
  const loadError = ref<string | null>(null);

  async function loadConstants(options: { forceRefresh?: boolean } = {}): Promise<PublicConstants> {
    if (isLoaded.value && !options.forceRefresh) {
      return constants.value;
    }

    isLoading.value = true;
    loadError.value = null;

    try {
      if (!isRemoteConstantsEnabled()) {
        constants.value = fallbackConstants;
        return constants.value;
      }

      const remote = await fetchPublicConstants();
      constants.value = {
        ...fallbackConstants,
        ...remote,
      };
      return constants.value;
    } catch (error) {
      constants.value = fallbackConstants;
      loadError.value = error instanceof Error ? error.message : "상수 로드에 실패했습니다.";
      throw error;
    } finally {
      isLoading.value = false;
      isLoaded.value = true;
    }
  }

  const siteUrl = computed(() => constants.value.siteUrl);
  const feeDataUpdated = computed(() => constants.value.feeDataUpdated);
  const feeDataVerified = computed(() => constants.value.feeDataVerified);
  const supportEmail = computed(() => constants.value.supportEmail);

  return {
    constants,
    isLoading,
    isLoaded,
    loadError,
    siteUrl,
    feeDataUpdated,
    feeDataVerified,
    supportEmail,
    loadConstants,
  };
});
