# Rune Framework — AI Agents Guide

## Overview

Rune is a batteries-included, web-standard, runtime-agnostic backend framework for TypeScript.

## Architecture

```
packages/
  foundation/
    tsconfig/     — Shared TypeScript configs (base, node, strict)
    core/         — Main request pipeline, RuneApp, Context, Middleware
    container/    — DI container (singleton, transient, request scopes)
    config/       — ConfigLoader (env-based config)

  runtime/
    router/       — URL router (wraps rou3)
    validation/   — class-validator + class-transformer integration
    decorators/   — @Controller, @Get, @Post, @Body, @Module, etc.
    events/       — EventAdapter interface + MemoryEventBus

  infrastructure/
    cache/        — CacheAdapter interface + MemoryCache
    database/     — DatabaseAdapter interface
    graphql/      — GraphQL adapter interface + GraphQLHandler
    queue/        — QueueAdapter interface
    mail/         — MailAdapter interface
    logger/       — LoggerAdapter interface + ConsoleLogger
    socket/       — SocketAdapter interface + SocketHandler
    telemetry/    — TelemetryAdapter interface + NoopTelemetry

  contracts/
    openapi/      — Auto-generate OpenAPI 3.0 spec from decorators

  tooling/
    create-rune/  — CLI to scaffold new projects

  adapters/
    bun/          — Bridge Rune to Bun
    hono/         — Bridge Rune to Hono
    elysia/       — Bridge Rune to Elysia
    fastify/      — Bridge Rune to Fastify
    express/      — Bridge Rune to Express
    koa/          — Bridge Rune to Koa
    worker/       — Cloudflare Workers adapter
    lambda/       — AWS Lambda adapter
    vercel/       — Vercel Edge adapter
    deno/         — Deno native HTTP server adapter
    node/         — Node.js http/https adapter
```

## Key Principles

1. **Web Standard First** — Everything is `Request -> Response`
2. **Runtime Agnostic** — Core never depends on Node/Bun/CF APIs
3. **Adapter Driven** — Infrastructure concerns swapped via interfaces
4. **Batteries Included** — Validation, OpenAPI, config, cache, logger, etc.

## Development Commands

```bash
bun run build          # Production build (minified) for all packages
bun run build:dev      # Dev build (unminified) for all packages
bun run test           # Run all tests
bun run test:coverage  # Run tests with coverage
bun run typecheck      # TypeScript check all packages
bun run lint           # Lint via oxlint
bun run format         # Format via oxfmt
bun run dev            # Watch mode (re-builds on change)
bun run bundle:size             # Show current bundle sizes (terminal, with diff if baseline exists)
bun run bundle:size --save      # Save current sizes as baseline + update docs/bundle-size.md
bun run bundle:size --json      # Output as JSON
bun run bundle:size --markdown  # Output as markdown
bun run bundle:size --baseline <file>  # Compare against specific baseline
```

## Adapter Pattern

Every infrastructure concern follows the same pattern:

```ts
// Interface (in @rune/cache, @rune/logger, etc.)
export interface CacheAdapter {
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: unknown, ttl?: number): Promise<void>;
}

// Implementation (in separate packages)
export class RedisCache implements CacheAdapter { ... }

// Usage
CacheModule.forRoot({ adapter: new RedisCache() })
```

## Workspace

Workspaces are defined in `package.json#workspaces` and managed by Bun:

```json
{
  "workspaces": [
    "packages/foundation/*",
    "packages/runtime/*",
    "packages/infrastructure/*",
    "packages/contracts/*",
    "packages/tooling/*",
    "packages/adapters/*"
  ]
}
```

Shared dependency versions use the `catalog:` protocol:

```jsonc
// root package.json
{
  "catalog": {
    "typescript": "^5.6.0"
  }
}

// workspace package
{
  "devDependencies": {
    "typescript": "catalog:"
  }
}
```

## Adding a New Package

1. Create `packages/<category>/<name>` with `package.json`, `tsconfig.json`, `src/index.ts`
2. Add to root `tsconfig.json` references
3. Workspace glob picks it up automatically

## Testing

- Powered by `bun test` (bun's native test runner with vitest API compatibility)
- Run: `bun run test` or `bun test`
- 100% code coverage enforced per file
- Tests live in `tests/*.test.ts` next to source

## Native Decorator Migration (Completed)

The framework has been fully migrated from legacy TypeScript experimental decorators (`experimentalDecorators: true`, `emitDecoratorMetadata`, `reflect-metadata`) to **TC39 stage 3 native decorators**.

### Key Changes

- **No `reflect-metadata`** — All decorators use native `(target, context)` signatures
- **No `experimentalDecorators`/`emitDecoratorMetadata`** in any `tsconfig.json`
- **WeakMap-based metadata** — Bun 1.4.0 doesn't share `context.metadata` between decorators and `Symbol.metadata` is `undefined`. A module-level `WeakMap<object, Record<string,unknown>>` replaces both `Reflect.*` and native `context.metadata` for cross-decorator communication
- **Method-decorator params** — Since native decorators don't support parameter decorators, `@Body`, `@Param`, `@Query`, `@Headers`, `@Req` are now method decorators. Outer decorator = leftmost parameter, inner decorator = rightmost parameter (implemented via `unshift`)
- **`@Controller` collects from methods** — Route decorators store entries on the method function. `@Controller` iterates prototype methods to aggregate route handlers + param metadata at class-decorator time
- **`@Deps` for DI** — Constructor type annotations are stripped by TypeScript/Bun transpilation. Use `@Deps(ServiceA, ServiceB)` on controllers/services to declare constructor dependencies explicitly
- **`getMeta`/`setMeta`/`deleteMeta`** — Central metadata helpers in `packages/runtime/decorators/src/metadata.ts`

### Known Limitation

`class-validator` decorators (`@IsString()`, `@IsEmail()`, etc.) are compiled for the old experimental decorator API. They throw when used with native decorators. Users needing DTO validation should either:

1. Use `class-validator` with `experimentalDecorators: true` in their own project
2. Write custom validation logic
3. Use the `ValidationPipe` without `class-validator` decorators (it passes through non-class values)

### Metadata API

```ts
import { getMeta, setMeta, deleteMeta, getOwnMeta } from "@rune/decorators";

// Store metadata on any object
setMeta(myObject, "my:key", value);

// Read metadata
const val = getMeta(myObject, "my:key");

// Delete metadata
deleteMeta(myObject, "my:key");
```

### All Decorators

| Decorator              | Kind         | Purpose                                |
| ---------------------- | ------------ | -------------------------------------- |
| `@Controller(prefix)`  | class        | Routes all methods under prefix        |
| `@Get(path)`           | method       | GET endpoint                           |
| `@Post(path)`          | method       | POST endpoint                          |
| `@Put(path)`           | method       | PUT endpoint                           |
| `@Delete(path)`        | method       | DELETE endpoint                        |
| `@Patch(path)`         | method       | PATCH endpoint                         |
| `@Body(dto?)`          | method       | Injects parsed request body            |
| `@Param()`             | method       | Injects URL path parameter             |
| `@Query()`             | method       | Injects query string parameter         |
| `@Headers()`           | method       | Injects request headers object         |
| `@Req()`               | method       | Injects Context object                 |
| `@UseGuard(...)`       | class/method | Guards for route protection            |
| `@UseInterceptor(...)` | class/method | Interceptors for response modification |
| `@Module(metadata)`    | class        | Nest-style module configuration        |
| `@Injectable(scope?)`  | class        | Marks class as DI provider             |
| `@Deps(...)`           | class        | Explicit constructor dependencies      |

### Linting Fixes

- **`no-await-in-loop`** — Guards loop uses `Promise.all` for parallel execution
- **`no-await-in-loop`** — Interceptors loop uses a chained pipeline pattern

### TypeCheck

- All packages build successfully
- No type errors
- All 427 tests pass, 2 skipped (class-validator incompatibility)

## Progress

### Done

- **Runtime adapter tests refactored** — Removed `@vercel/fun` from all runtime tests. Pure function adapters (vercel, cloudflare, netlify) now import compiled modules directly. Node.js tests spawn child processes with real HTTP servers.
- **New npm scripts** — `test:runtime:vercel`, `test:runtime:cloudflare`, `test:runtime:deno`, `test:runtime:netlify`, `test:runtime:node`, `test:runtime:node-ts`
- **Blog API tests** — Added 4 new tests in `examples/applications/blog-api/tests/index.test.ts` (tags filter, cache hit on getPost, update non-existent post, cache hit on createPost)
- **Task Manager tests** — Added 5 new tests in `examples/applications/task-manager/tests/index.test.ts` (cache get, status/priority filters, limit/offset, update non-existent, comment non-existent) + fixed no-await-in-loop lint warning
- **Wrapper renames** — Renamed `lambda-wrapper` to `worker-wrapper` (cloudflare), `edge-wrapper` (deno), `function-wrapper` (netlify) to match platform terminology; later removed as `@vercel/fun` was eliminated
- **Node.js runtime tests created** — `runtime-tests/node/` tests `createNodeServer` (full HTTP server lifecycle via `bun run` child process), `runtime-tests/node-ts/` tests TypeScript decorator pipeline via direct module import (no build process)
- **Deno runtime test** — `runtime-tests/deno/` tests `Deno.serve()` via `bun build --target=bun` bundle executed by `deno run`
- **Bundle size tracking** — `scripts/bundle-size.ts` measures raw/gzip/brotli sizes per package. Run `bun run size` for terminal output, `bun run size:save` to persist baseline + update `docs/bundle-size.md`. On each PR push, `bundle-size.yml` posts a comparison comment. Pre-commit hook saves baseline automatically. Terminal output uses green/orange/red ANSI indicators; markdown/CI output uses emoji indicators.
