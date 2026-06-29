/**
 * Cache storage adapter interface.
 * Provides a generic contract for cache operations with TTL support.
 */
export interface CacheAdapter {
  /**
   * Retrieve a value by key from the cache.
   * @template T - The expected type of the cached value.
   * @param key - The cache key.
   * @returns The cached value or null if not found or expired.
   *
   * @example
   * ```ts
   * const value = await cache.get<string>("my-key");
   * if (value) console.log(value);
   * ```
   */
  get<T>(key: string): Promise<T | null>;

  /**
   * Store a value in the cache.
   * @param key - The cache key.
   * @param value - The value to cache.
   * @param ttl - Time-to-live in seconds. If omitted, the entry never expires.
   *
   * @example
   * ```ts
   * await cache.set("my-key", { user: "alice" }, 3600);
   * ```
   */
  set(key: string, value: unknown, ttl?: number): Promise<void>;

  /**
   * Remove a single entry from the cache.
   * @param key - The cache key to delete.
   *
   * @example
   * ```ts
   * await cache.delete("my-key");
   * ```
   */
  delete(key: string): Promise<void>;

  /**
   * Remove all entries from the cache.
   *
   * @example
   * ```ts
   * await cache.clear();
   * ```
   */
  clear(): Promise<void>;
}
