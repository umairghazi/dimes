interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const TTL = {
  ANALYTICS: 60 * 60 * 1000,       // 1 hour
  RECURRING: 4 * 60 * 60 * 1000,   // 4 hours
  BUDGETS: 4 * 60 * 60 * 1000,     // 4 hours
  CATEGORIES: 8 * 60 * 60 * 1000,  // 8 hours
} as const;

class AppCache {
  private readonly store = new Map<string, CacheEntry<unknown>>();

  get<T>(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value as T;
  }

  set<T>(key: string, value: T, ttlMs: number): void {
    this.store.set(key, { value, expiresAt: Date.now() + ttlMs });
  }

  del(key: string): void {
    this.store.delete(key);
  }

  /** Delete all keys that start with the given prefix. */
  delPrefix(prefix: string): void {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) this.store.delete(key);
    }
  }
}

export const cache = new AppCache();
export { TTL };
