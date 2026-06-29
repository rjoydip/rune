import type { CacheAdapter } from "./adapter.js";

interface CacheEntry {
  value: unknown;
  expiresAt: number | null;
}

/**
 * In-memory implementation of the CacheAdapter.
 * Stores entries in a Map with optional TTL-based expiration.
 *
 * @example
 * ```ts
 * const cache = new MemoryCache();
 * await cache.set("key", "value");
 * const val = await cache.get<string>("key");
 * ```
 */
export class MemoryCache implements CacheAdapter {
  private readonly store = new Map<string, CacheEntry>();

  /**
   * Retrieve a value by key. Returns null if the key does not exist or the entry has expired.
   * @template T - The expected type of the cached value.
   * @param key - The cache key.
   * @returns The cached value or null.
   *
   * @example
   * ```ts
   * const val = await cache.get<string>("session");
   * console.log(val ?? "not found");
   * ```
   */
  async get<T>(key: string): Promise<T | null> {
    const entry = this.store.get(key);
    if (!entry) return null;

    if (entry.expiresAt !== null && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return entry.value as T;
  }

  /**
   * Store a value with an optional TTL.
   * @param key - The cache key.
   * @param value - The value to store.
   * @param ttl - Time-to-live in seconds. If omitted, the entry never expires.
   *
   * @example
   * ```ts
   * await cache.set("token", "abc123", 900);
   * ```
   */
  async set(key: string, value: unknown, ttl?: number): Promise<void> {
    this.store.set(key, {
      value,
      expiresAt: ttl !== undefined ? Date.now() + ttl * 1000 : null,
    });
  }

  /**
   * Remove a single entry from the cache.
   * @param key - The cache key to delete.
   *
   * @example
   * ```ts
   * await cache.delete("token");
   * ```
   */
  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  /**
   * Remove all entries from the cache.
   *
   * @example
   * ```ts
   * await cache.clear();
   * ```
   */
  async clear(): Promise<void> {
    this.store.clear();
  }
}
