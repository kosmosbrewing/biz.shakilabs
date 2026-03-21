export const DEFAULT_SITE_URL = "https://shakilabs.com/biz";

/** 정규 사이트 URL (trailing slash 없음) */
export function getCanonicalSiteUrl(): string {
  return DEFAULT_SITE_URL;
}

/** 런타임 origin + base path 를 반환 (SSR/CSR 호환) */
export function getSiteUrl(): string {
  if (typeof window !== "undefined" && window.location.origin) {
    const basePath = new URL(getCanonicalSiteUrl()).pathname.replace(/\/+$/, "");
    return trimTrailingSlash(`${window.location.origin}${basePath}`);
  }
  return getCanonicalSiteUrl();
}

/** canonical URL 조립 — base path 를 자동으로 포함 */
export function buildCanonicalUrl(path: string, queryString = "", hash = ""): string {
  const baseUrl = new URL(getCanonicalSiteUrl());
  const basePath = baseUrl.pathname.replace(/\/+$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  baseUrl.pathname = `${basePath}${normalizedPath}`;
  baseUrl.search = queryString ? `?${queryString.replace(/^\?/, "")}` : "";
  baseUrl.hash = hash ? `#${hash.replace(/^#/, "")}` : "";
  return baseUrl.toString();
}

function trimTrailingSlash(url: string): string {
  return url.replace(/\/+$/, "");
}
