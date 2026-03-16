export const DEFAULT_SITE_URL = "https://biz.shakilabs.com";

export function getSiteUrl(): string {
  if (typeof window !== "undefined" && window.location.origin) {
    return window.location.origin;
  }

  return DEFAULT_SITE_URL;
}
