/// <reference types="vite/client" />
import "vue-router";

declare global {
  const __BUILD_DATE__: string;
}

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_ENABLE_AUTH?: string;
  readonly VITE_ENABLE_REMOTE_CONSTANTS?: string;
  readonly VITE_GA_MEASUREMENT_ID?: string;
  readonly VITE_GA4_MEASUREMENT_ID?: string;
  readonly VITE_GA_DEBUG?: string;
  readonly VITE_ADSENSE_PUBLISHER_ID?: string;
  readonly VITE_ADSENSE_SLOT_TOP?: string;
  readonly VITE_ADSENSE_SLOT_BOTTOM?: string;
  readonly VITE_ADSENSE_SLOT_MARKET_COMPARE?: string;
  readonly VITE_ADSENSE_SLOT_PAYMENT_COMPARE?: string;
  readonly VITE_ADSENSE_SLOT_SHIPPING_COMPARE?: string;
  readonly VITE_KAKAO_JS_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module "vue-router" {
  interface RouteMeta {
    title?: string;
    requiresAuth?: boolean;
    requiresAdmin?: boolean;
    guestOnly?: boolean;
  }
}

declare module "*.vue" {
  import type { DefineComponent } from "vue";
  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>;
  export default component;
}

export {};
