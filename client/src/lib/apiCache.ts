interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

class ApiCache {
  private cache = new Map<string, CacheEntry<unknown>>();

  constructor(private readonly maxSize = 100) {}

  get<T>(key: string, maxAge: number): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > maxAge) {
      this.cache.delete(key);
      return null;
    }

    this.cache.delete(key);
    this.cache.set(key, cached);
    return cached.data as T;
  }

  set<T>(key: string, data: T): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    while (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (!oldestKey) break;
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  invalidate(pattern: string | RegExp): void {
    const regex = typeof pattern === "string" ? new RegExp(pattern) : pattern;
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }
}

export const cachePolicies = {
  authSession: { maxAge: 30 * 1000 },
  constants: { maxAge: 60 * 60 * 1000 },
  noCache: { maxAge: 0 },
} as const;

export const NEVER_CACHE_PATTERNS = [
  /^\/api\/auth\/login$/,
  /^\/api\/auth\/logout$/,
  /^\/api\/auth\/session$/,
] as const;

export function shouldSkipCacheForEndpoint(endpoint: string): boolean {
  return NEVER_CACHE_PATTERNS.some((pattern) => pattern.test(endpoint));
}

export const apiCache = new ApiCache();
