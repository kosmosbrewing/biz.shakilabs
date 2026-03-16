declare global {
  interface Window {
    Kakao?: {
      init: (key: string) => void;
      isInitialized: () => boolean;
      Share: {
        sendDefault: (params: Record<string, unknown>) => void;
      };
    };
  }
}

const KAKAO_SDK_VERSION = "2.7.4";
let kakaoSdkPromise: Promise<void> | null = null;

/** Kakao SDK를 로드하고 초기화. 이미 로드된 경우 즉시 resolve */
export async function ensureKakaoSdk(): Promise<void> {
  if (typeof window === "undefined" || typeof document === "undefined") {
    throw new Error("Kakao SDK requires browser environment");
  }

  if (window.Kakao) return;
  if (kakaoSdkPromise) return kakaoSdkPromise;

  const key = (import.meta.env.VITE_KAKAO_JS_KEY || "").trim();
  if (!key) throw new Error("KAKAO_JS_KEY not configured");

  kakaoSdkPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-kakao-sdk="true"]');
    if (existing) {
      if (window.Kakao) { resolve(); return; }
      if (existing.dataset.loaded === "true") { reject(new Error("Kakao SDK not available")); return; }
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Kakao SDK load failed")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = `https://t1.kakaocdn.net/kakao_js_sdk/${KAKAO_SDK_VERSION}/kakao.min.js`;
    script.async = true;
    script.dataset.kakaoSdk = "true";
    script.onload = () => { script.dataset.loaded = "true"; resolve(); };
    script.onerror = () => reject(new Error("Kakao SDK load failed"));
    document.head.appendChild(script);
  }).then(() => {
    if (window.Kakao && !window.Kakao.isInitialized()) {
      window.Kakao.init(key);
    }
  }).finally(() => {
    if (!window.Kakao) kakaoSdkPromise = null;
  });

  return kakaoSdkPromise;
}
