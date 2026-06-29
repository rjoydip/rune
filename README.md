# Rune

> A batteries-included, web-standard, runtime-agnostic backend framework.

```txt
Request → Router → Middleware → Guards → Validation → Controller → Response
```

## Features

- **Web Standard** — Built on `Request` / `Response`. Works everywhere.
- **Runtime Agnostic** — Node, Bun, Deno, Cloudflare Workers, Lambda, Vercel Edge.
- **Decorator DX** — `@Controller`, `@Get`, `@Post`, `@Body`, `@Module`, `@Injectable`.
- **DI Container** — Singleton, transient, and request-scoped injection.
- **Validation** — Auto-DTO validation via `class-validator` + `class-transformer`.
- **OpenAPI** — Auto-generate OpenAPI 3.0 spec from decorators.
- **Adapters** — Swap cache, queue, database, mail, events, telemetry via interfaces.
- **Lightweight** — Core under 100KB target.

## Quick Start

```bash
bunx create-rune my-app
cd my-app
bun install
bun run dev
```

## Example

```ts
import { createApp } from "@rune/core";
import { Module, Controller, Get, Post, Body } from "@rune/decorators";

@Controller("/users")
export class UserController {
  @Get("/")
  findAll() {
    return [{ id: 1, name: "Alice" }];
  }

  @Post("/")
  create(@Body() data: unknown) {
    return { created: data };
  }
}

@Module({
  controllers: [UserController],
  providers: [],
  imports: [],
  exports: [],
})
export class AppModule {}

const app = createApp();
app.registerModule(AppModule);
app.init();

// Deploy anywhere:
//   Bun:      Bun.serve({ fetch: (req) => app.fetch(req) })
//   Node:     http.createServer((req, res) => ...)
//   Workers:  export default { fetch: (req) => app.fetch(req) }
//   Hono:     toHono(app)
//   Fastify:  toFastify(app, fastify)
//   Express:  toExpress(app, express)
//   Lambda:   toLambdaHandler(app)
```

## Packages

| Package            | Description                                                |
| ------------------ | ---------------------------------------------------------- |
| `@rune/tsconfig`   | Shared TypeScript configs (base, node, strict)             |
| `@rune/core`       | Main framework — RuneApp, Context, middleware pipeline     |
| `@rune/container`  | DI container (singleton/transient/request)                 |
| `@rune/router`     | URL router (rou3-based)                                    |
| `@rune/decorators` | Decorators: @Controller, @Get, @Post, @Module, @Injectable |
| `@rune/validation` | DTO validation via class-validator                         |
| `@rune/openapi`    | Auto-generate OpenAPI 3.0 + Swagger UI                     |
| `@rune/cache`      | Cache adapter + MemoryCache                                |
| `@rune/logger`     | Logger adapter + ConsoleLogger                             |
| `@rune/events`     | Event bus adapter + MemoryEventBus                         |
| `@rune/graphql`    | GraphQL adapter + built-in GraphQLHandler                  |
| `@rune/config`     | Environment-based config loader                            |
| `@rune/database`   | Database adapter interface                                 |
| `@rune/queue`      | Queue adapter interface                                    |
| `@rune/socket`     | Socket adapter + built-in SocketHandler                    |
| `@rune/mail`       | Mail adapter interface                                     |
| `@rune/telemetry`  | Telemetry adapter + NoopTelemetry                          |

### Adapters

| Package                            | Target                 | Location                               |
| ---------------------------------- | ---------------------- | -------------------------------------- |
| `@rune/adapter-hono`               | Hono                   | `packages/adapters/hono`               |
| `@rune/adapter-elysia`             | Elysia                 | `packages/adapters/elysia`             |
| `@rune/adapter-fastify`            | Fastify                | `packages/adapters/fastify`            |
| `@rune/adapter-express`            | Express                | `packages/adapters/express`            |
| `@rune/adapter-koa`                | Koa                    | `packages/adapters/koa`                |
| `@rune/adapter-bun`                | Bun                    | `packages/adapters/bun`                |
| `@rune/adapter-cloudflare-workers` | Cloudflare Workers     | `packages/adapters/cloudflare-workers` |
| `@rune/adapter-cloudflare-pages`   | Cloudflare Pages       | `packages/adapters/cloudflare-pages`   |
| `@rune/adapter-lambda-edge`        | Lambda@Edge            | `packages/adapters/lambda-edge`        |
| `@rune/adapter-aws-lambda`         | AWS Lambda             | `packages/adapters/aws-lambda`         |
| `@rune/adapter-service-worker`     | Service Worker         | `packages/adapters/service-worker`     |
| `@rune/adapter-netlify`            | Netlify Edge/Functions | `packages/adapters/netlify`            |
| `@rune/adapter-vercel`             | Vercel Edge            | `packages/adapters/vercel`             |

## Architecture

```sh
Incoming Request
        │
        ▼
      Router  (rou3)
        │
        ▼
Middleware Pipeline (app.use(...))
        │
        ▼
     Guards  (authentication, authorization)
        │
        ▼
Validation Pipe  (class-validator / class-transformer)
        │
        ▼
   Controller  (@Controller, @Get, @Post)
        │
        ▼
  Response  (Web API Response)
```

## Adapter System

Every infrastructure concern is interface-driven:

```ts
interface CacheAdapter {
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: unknown, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
}

// Swap implementations without changing application code
CacheModule.forRoot({ adapter: new RedisAdapter() });
CacheModule.forRoot({ adapter: new MemoryCache() });
CacheModule.forRoot({ adapter: new CloudflareKVAdapter() });
```

## Development

```bash
# Prerequisites: Bun (https://bun.sh)
curl -fsSL https://bun.sh/install | bash

# Setup
git clone https://github.com/rune/rune
cd rune
bun install

# Build all packages (production, minified)
bun run build

# Build all packages (dev, unminified)
bun run build:dev

# Run all tests
bun run test

# Run tests with coverage (100% threshold)
bun run test:coverage

# Type check all packages
bun run typecheck

# Lint & format
bunx oxlint .
bunx oxfmt .

# Watch mode (auto-rebuild on changes)
bun run dev
```

### Runtime Tests

Integration tests for runtime adapters validate each target runtime. Pure function adapters (Vercel, Cloudflare, Netlify) import compiled modules directly. Node.js tests spawn real HTTP servers via child processes. Deno tests bundle with Bun and execute via `deno run`.

```bash
# Run all runtime tests
bun run test:runtime:vercel
bun run test:runtime:cloudflare
bun run test:runtime:deno
bun run test:runtime:netlify
bun run test:runtime:node
bun run test:runtime:node-ts
```

Each runtime test suite lives in `runtime-tests/<runtime>/`.

## License

MIT
