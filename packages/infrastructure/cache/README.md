# @rune/cache

Caching abstraction with an adapter interface. Includes an in-memory implementation with TTL support.

## Exports

| Name           | Kind      |
| -------------- | --------- |
| `CacheAdapter` | Interface |
| `MemoryCache`  | Class     |

## Usage

```ts
import { MemoryCache } from "@rune/cache";

const cache = new MemoryCache();
await cache.set("key", { data: 42 }, 60_000); // TTL 60s
const value = await cache.get("key"); // { data: 42 }
await cache.delete("key");
await cache.clear();
```

## API

### CacheAdapter

| Method                  | Description                                    |
| ----------------------- | ---------------------------------------------- |
| `get<T>(key)`           | Gets a value by key; returns `null` if missing |
| `set(key, value, ttl?)` | Sets a value with optional TTL in ms           |
| `delete(key)`           | Deletes a key                                  |
| `clear()`               | Clears all keys                                |

### MemoryCache

In-memory `Map`-based implementation using `Date.now()` for TTL expiration.

## Dependencies

None.
