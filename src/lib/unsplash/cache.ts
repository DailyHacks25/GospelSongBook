/**
 * Small in-memory TTL cache with a bounded entry count (LRU-by-insertion).
 * Used to respect Unsplash rate limits: identical searches are served from
 * memory until the TTL expires instead of hitting the API on every request.
 */

interface CacheEntry<V> {
  value: V;
  expiresAt: number;
}

export interface TtlCacheOptions {
  ttlMs: number;
  maxEntries?: number;
  /** Injectable clock for deterministic tests. */
  now?: () => number;
}

export class TtlCache<V> {
  private readonly store = new Map<string, CacheEntry<V>>();
  private readonly ttlMs: number;
  private readonly maxEntries: number;
  private readonly now: () => number;

  constructor(options: TtlCacheOptions) {
    if (options.ttlMs <= 0) throw new Error("ttlMs must be positive");
    if (options.maxEntries !== undefined && options.maxEntries <= 0) {
      throw new Error("maxEntries must be positive");
    }
    this.ttlMs = options.ttlMs;
    this.maxEntries = options.maxEntries ?? 100;
    this.now = options.now ?? (() => Date.now());
  }

  get(key: string): V | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt <= this.now()) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value;
  }

  has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  set(key: string, value: V): void {
    // Re-insert to mark as most recently used.
    this.store.delete(key);
    this.store.set(key, { value, expiresAt: this.now() + this.ttlMs });
    this.prune();
    while (this.store.size > this.maxEntries) {
      const oldest = this.store.keys().next();
      if (oldest.done) break;
      this.store.delete(oldest.value);
    }
  }

  delete(key: string): boolean {
    return this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  get size(): number {
    return this.store.size;
  }

  /** Drop expired entries. */
  prune(): void {
    const cutoff = this.now();
    for (const [key, entry] of this.store) {
      if (entry.expiresAt <= cutoff) this.store.delete(key);
    }
  }
}
