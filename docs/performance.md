---
title: Performance
description: Benchmarks, optimization tips, and performance tuning
sidebar:
  order: 4
---

## Overview

Rune is designed for minimal overhead. The entire pipeline uses a composable middleware pattern with zero dependencies on heavy frameworks. Key design choices:

- **Web-standard Request/Response** — no wrapper objects, no serialization overhead
- **Simple middleware pipeline** — classic onion dispatch, no heavy abstractions
- **WeakMap-based metadata** — avoids `Reflect.*` overhead
- **Tree-shakeable packages** — only import what you use
- **Bun-native** — when deployed on Bun, the JIT compiles hot paths efficiently

## Benchmarks

Run the benchmark suite:

```bash
bun perf/bench.ts
```

Typical results (Bun 1.2, single core, macOS):

| Framework | Requests/sec (routing) | Requests/sec (JSON) | Latency (p50) |
| --------- | ---------------------- | ------------------- | ------------- |
| Rune      | ~180,000               | ~150,000            | ~0.03ms       |
| Hono      | ~175,000               | ~145,000            | ~0.04ms       |
| Express   | ~25,000                | ~20,000             | ~0.3ms        |

## Optimization Tips

### 1. Use Appropiate Runtime

- **Bun** — Fastest startup and hot-path execution for Rune
- **Deno** — Good all-around, similar perf to Bun
- **Node.js** — Slightly slower but widest ecosystem

### 2. Minimize Middleware

Each middleware adds a function call per request. Keep the pipeline lean:

```ts
// Instead of 3 middlewares:
app.use(cors());
app.use(logger());
app.use(requestId());

// Consider combining:
app.use(async (ctx, next) => {
  const start = Date.now();
  const id = crypto.randomUUID();
  ctx.state.set("requestId", id);
  await next();
  console.log(`${id} ${Date.now() - start}ms`);
});
```

### 3. Skip JSON Parsing

If you don't need the body, don't call `ctx.body`:

```ts
@Get("/health")
health() {
  return { status: "ok" }; // No body parsing needed
}
```

### 4. Avoid Throwing for Control Flow

Throw/catch is expensive in hot paths. Use early returns instead:

```ts
// Prefer:
@Get("/:id")
async getUser(@Param() id: string) {
  const user = await db.findUser(id);
  if (!user) {
    return new Response("Not Found", { status: 404 });
  }
  return user;
}

// Over:
@Get("/:id")
async getUser(@Param() id: string) {
  const user = await db.findUser(id);
  if (!user) throw new NotFoundError();
  return user;
}
```

### 5. Use Singleton Providers

Mark stateless services as `@Injectable("singleton")` to avoid repeated instantiation:

```ts
@Injectable("singleton")
export class UserService {
  findAll() {
    /* ... */
  }
}
```

### 6. Cache Repeated Results

```ts
import { MemoryCache } from "@rune/cache";

const cache = new MemoryCache();

@Injectable("singleton")
export class ProductService {
  async findById(id: string) {
    const cached = await cache.get(`product:${id}`);
    if (cached) return cached;
    const product = await db.products.findById(id);
    await cache.set(`product:${id}`, product, 60);
    return product;
  }
}
```

### 7. Use the Fast Path for Simple Controllers

Controllers without constructor dependencies, guards, interceptors, or DTO validation automatically use a **pre-instantiated fast path** that skips DI resolution, guard checks, and interceptor chains. The controller instance is created once at startup and reused for every request.

```ts
// This controller is "simple" — no deps, guards, interceptors, DTOs
@Controller("/api")
class BenchmarkController {
  @Get("/hello")
  hello() {
    return { message: "hello" };
  }
}
```

What the fast path eliminates per request:

- `Container.createScope()` — no scoped container allocation
- `Container.resolve(Controller)` — no DI resolution
- Guard check loop + interceptor chain closures
- `Promise.all` over guard results

### 8. Pre-Compiled JSON Serialization

When the fast path detects a controller's response shape, it lazily compiles an optimized JSON serializer. The first request analyzes the returned object keys and generates a tight `for` loop that produces JSON directly, avoiding `JSON.stringify()`'s generic reflection overhead.

```ts
// First request: learns keys {"message", "id"}
// Subsequent requests: uses compiled serializer
@Get("/user/:id")
@Param()
getUser(id: string) {
  return { id };  // compiled to: '{"id":"'+o.id+'"}'
}
```

### 9. Router Static Cache

Routes without dynamic path segments (`:param` or `*` wildcards) are cached in a `Map` for O(1) hash-based lookup, bypassing the radix-tree traversal entirely.

### 10. Middleware Pipeline Bypass

When no middleware is registered, `compose()` returns a direct call to the handler without creating the dispatch closure chain, saving per-request allocations.

### 11. Batch Database Queries

Use `Promise.all` for independent queries:

```ts
@Get("/dashboard")
async dashboard() {
  const [users, orders, metrics] = await Promise.all([
    db.users.count(),
    db.orders.recent(),
    db.metrics.summary(),
  ]);
  return { users, orders, metrics };
}
```

## Profiling

Use the built-in middleware pattern for ad-hoc profiling:

```ts
app.use(async (ctx, next) => {
  const start = performance.now();
  await next();
  const elapsed = performance.now() - start;
  if (elapsed > 100) {
    console.warn(`Slow request: ${ctx.request.url} (${elapsed.toFixed(2)}ms)`);
  }
});
```
