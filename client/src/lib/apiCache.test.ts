import { describe, expect, it } from "vitest";
import { apiCache, shouldSkipCacheForEndpoint } from "@/lib/apiCache";

describe("apiCache", () => {
  it("stores and returns cached entries within maxAge", () => {
    apiCache.clear();
    apiCache.set("constants", { ok: true });

    expect(apiCache.get<{ ok: boolean }>("constants", 1000)).toEqual({ ok: true });
  });

  it("invalidates entries by pattern", () => {
    apiCache.clear();
    apiCache.set("/api/constants", { version: "2025.06" });
    apiCache.invalidate(/^\/api\/constants$/);

    expect(apiCache.get("/api/constants", 1000)).toBeNull();
  });
});

describe("shouldSkipCacheForEndpoint", () => {
  it("disables cache for auth mutation endpoints", () => {
    expect(shouldSkipCacheForEndpoint("/api/auth/login")).toBe(true);
    expect(shouldSkipCacheForEndpoint("/api/auth/logout")).toBe(true);
  });

  it("allows cache for non-sensitive public endpoints", () => {
    expect(shouldSkipCacheForEndpoint("/api/constants")).toBe(false);
  });
});
