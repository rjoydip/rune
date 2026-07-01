/**
 * Re-exports for the cache module.
 * @module @rune/cache
 */

/** Cache adapter type definition. */
export type { CacheAdapter } from "./adapter.js";
/** In-memory implementation of the cache adapter. */
export { MemoryCache } from "./memory-cache.js";
