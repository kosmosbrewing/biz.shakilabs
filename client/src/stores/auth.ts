import { computed, ref } from "vue";
import { defineStore } from "pinia";
import { ApiError, fetchCurrentUser, isAuthEnabled, login, logout } from "@/lib/api";
import { apiCache } from "@/lib/apiCache";
import type { LoginPayload, User } from "@/types/api";

export const useAuthStore = defineStore("auth", () => {
  const user = ref<User | null>(null);
  const isLoading = ref(false);
  const isInitialized = ref(false);
  const lastError = ref<string | null>(null);

  const isAuthenticated = computed(() => Boolean(user.value));
  const isAdmin = computed(() => user.value?.isAdmin ?? false);
  const isEnabled = computed(() => isAuthEnabled());

  async function loadUser(
    options: { forceRefresh?: boolean; throwOnError?: boolean } = {}
  ): Promise<User | null> {
    if (!isEnabled.value) {
      user.value = null;
      isInitialized.value = true;
      lastError.value = null;
      return null;
    }

    if (isInitialized.value && !options.forceRefresh) {
      return user.value;
    }

    isLoading.value = true;
    lastError.value = null;

    try {
      user.value = await fetchCurrentUser();
      return user.value;
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        user.value = null;
        return null;
      }

      lastError.value =
        error instanceof Error ? error.message : "사용자 정보를 불러오지 못했습니다.";
      user.value = null;

      if (options.throwOnError) {
        throw error;
      }

      return null;
    } finally {
      isLoading.value = false;
      isInitialized.value = true;
    }
  }

  async function handleLogin(credentials: LoginPayload): Promise<User> {
    if (!isEnabled.value) {
      throw new Error("인증 기능이 비활성화되어 있습니다.");
    }

    isLoading.value = true;
    lastError.value = null;

    try {
      const loggedInUser = await login(credentials);
      user.value = loggedInUser;
      isInitialized.value = true;
      apiCache.invalidate(/^https?:\/\/.*\/api\/auth\//);
      apiCache.invalidate(/^\/api\/auth\//);
      return loggedInUser;
    } catch (error) {
      lastError.value = error instanceof Error ? error.message : "로그인에 실패했습니다.";
      throw error;
    } finally {
      isLoading.value = false;
    }
  }

  async function handleLogout(): Promise<void> {
    if (!isEnabled.value) {
      user.value = null;
      isInitialized.value = true;
      lastError.value = null;
      return;
    }

    isLoading.value = true;
    lastError.value = null;

    try {
      await logout();
    } catch (error) {
      lastError.value = error instanceof Error ? error.message : "로그아웃에 실패했습니다.";
      throw error;
    } finally {
      user.value = null;
      isInitialized.value = true;
      isLoading.value = false;
      apiCache.clear();
    }
  }

  function clearAuthState(): void {
    user.value = null;
    isInitialized.value = false;
    isLoading.value = false;
    lastError.value = null;
  }

  return {
    user,
    isLoading,
    isInitialized,
    lastError,
    isEnabled,
    isAuthenticated,
    isAdmin,
    loadUser,
    handleLogin,
    handleLogout,
    clearAuthState,
  };
});
