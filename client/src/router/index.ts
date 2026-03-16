import { nextTick } from "vue";
import type { Router, RouteRecordRaw } from "vue-router";
import { showAlert } from "@/composables/useAlert";
import { trackPageView } from "@/lib/analytics";
import { useAuthStore } from "@/stores/auth";

export const routes: RouteRecordRaw[] = [
  {
    path: "/",
    name: "Home",
    component: () => import("@/views/HomeView.vue"),
  },
  {
    path: "/individual-vs-corp",
    name: "IndividualVsCorp",
    component: () => import("@/views/IndividualVsCorpView.vue"),
  },
  {
    path: "/break-even",
    name: "BreakEven",
    component: () => import("@/views/BreakEvenView.vue"),
  },
  {
    path: "/vat-compare",
    name: "VatCompare",
    component: () => import("@/views/VatCompareView.vue"),
  },
  {
    path: "/delivery-fee",
    name: "DeliveryFee",
    component: () => import("@/views/DeliveryFeeView.vue"),
  },
  {
    path: "/about",
    name: "About",
    component: () => import("@/views/AboutView.vue"),
  },
  {
    path: "/terms",
    name: "Terms",
    component: () => import("@/views/TermsView.vue"),
  },
  {
    path: "/privacy",
    name: "Privacy",
    component: () => import("@/views/PrivacyView.vue"),
  },
  {
    path: "/:pathMatch(.*)*",
    name: "NotFound",
    component: () => import("@/views/NotFoundView.vue"),
  },
];

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

export function createScrollBehavior(): Router["options"]["scrollBehavior"] {
  return (to, from, savedPosition) => {
    if (savedPosition) return savedPosition;
    if (to.hash) return { el: to.hash, behavior: "smooth", top: 80 };
    if (to.path === from.path) return false;
    return { top: 0 };
  };
}

export function setupRouterGuards(router: Router): void {
  router.beforeEach(async (to) => {
    const authStore = useAuthStore();
    const needsAuthState = Boolean(to.meta.requiresAuth || to.meta.requiresAdmin || to.meta.guestOnly);

    if (needsAuthState && !authStore.isInitialized) {
      try {
        await authStore.loadUser({ throwOnError: true });
      } catch {
        if (isBrowser()) {
          showAlert("사용자 정보를 불러오지 못했습니다.", { type: "error" });
        }
        return false;
      }
    }

    if (to.meta.guestOnly && authStore.isAuthenticated) {
      return "/";
    }

    if (to.meta.requiresAuth && !authStore.isAuthenticated) {
      if (isBrowser()) {
        showAlert("로그인이 필요합니다.", { type: "error" });
      }
      return "/";
    }

    if (to.meta.requiresAdmin && !authStore.isAdmin) {
      if (isBrowser()) {
        showAlert("관리자 권한이 필요합니다.", { type: "error" });
      }
      return "/";
    }

    return true;
  });

  router.afterEach((to, _from, failure) => {
    if (failure || !isBrowser()) return;
    void nextTick(() => {
      trackPageView(to.fullPath, document.title);
    });
  });
}
