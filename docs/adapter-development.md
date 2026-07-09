---
title: Adapter Development
description: Writing custom adapters for Rune infrastructure
sidebar:
  order: 3
---

Rune's adapter pattern lets you plug in any runtime or infrastructure backend by implementing a simple interface.

## Runtime Adapters

A runtime adapter bridges the `RuneApp.fetch(Request) => Promise<Response>` contract to a specific HTTP server.

### Pattern

```ts
import type { RuneApp } from "@rune/core";

export function toMyFramework(app: RuneApp): MyFrameworkApp {
  const frameworkApp = new MyFrameworkApp();

  frameworkApp.all("*", async (req, res) => {
    const request = new Request(`http://localhost${req.url}`, {
      method: req.method,
      headers: req.headers,
      body: req.method !== "GET" ? JSON.stringify(req.body) : undefined,
    });

    const response = await app.fetch(request);

    res.status(response.status);
    response.headers.forEach((value, key) => res.setHeader(key, value));
    res.send(await response.text());
  });

  return frameworkApp;
}
```

### Key Steps

1. **Construct a Web Standard Request** — Convert the framework's native request into a `Request` object
2. **Call `app.fetch(request)`** — Delegate to the Rune pipeline
3. **Write back the Response** — Copy status, headers, and body to the framework's native response

### Full Example: Koa Adapter

```ts
import type { RuneApp } from "@rune/core";
import type { Middleware as KoaMiddleware } from "koa";

export function toKoaMiddleware(app: RuneApp): KoaMiddleware {
  return async (ctx) => {
    const url = `${ctx.protocol}://${ctx.host}${ctx.originalUrl}`;
    const request = new Request(url, {
      method: ctx.method,
      headers: ctx.headers as Record<string, string>,
      body: ctx.method !== "GET" ? JSON.stringify(ctx.request.body) : undefined,
    });

    const response = await app.fetch(request);

    ctx.status = response.status;
    response.headers.forEach((value, key) => ctx.set(key, value));
    ctx.body = await response.text();
  };
}
```

## Infrastructure Adapters

Infrastructure adapters implement one of the provided interfaces:

### CacheAdapter

```ts
import type { CacheAdapter } from "@rune/cache";

export class RedisCache implements CacheAdapter {
  async get<T>(key: string): Promise<T | null> {
    const value = await redis.get(key);
    return value ? (JSON.parse(value) as T) : null;
  }

  async set(key: string, value: unknown, ttl?: number): Promise<void> {
    const serialized = JSON.stringify(value);
    if (ttl) {
      await redis.setex(key, ttl, serialized);
    } else {
      await redis.set(key, serialized);
    }
  }
}
```

### LoggerAdapter

```ts
import type { LoggerAdapter } from "@rune/logger";

export class FileLogger implements LoggerAdapter {
  constructor(private path: string) {}

  info(...args: unknown[]): void {
    this.write("INFO", args);
  }
  warn(...args: unknown[]): void {
    this.write("WARN", args);
  }
  error(...args: unknown[]): void {
    this.write("ERROR", args);
  }
  debug(...args: unknown[]): void {
    this.write("DEBUG", args);
  }

  private write(level: string, args: unknown[]) {
    const line = `[${new Date().toISOString()}] [${level}] ${args.join(" ")}\n`;
    require("fs").appendFileSync(this.path, line);
  }
}
```

### DatabaseAdapter

```ts
import type { DatabaseAdapter } from "@rune/database";
// Or import directly from core:
// import type { DatabaseAdapter } from "@rune/database-core";

export class PostgresAdapter implements DatabaseAdapter {
  constructor(private pool: Pool) {}

  async connect(): Promise<void> {
    await this.pool.connect();
  }

  async disconnect(): Promise<void> {
    await this.pool.end();
  }
}
```

The `@rune/database` umbrella re-exports from three sub-packages:

| Package                  | Exports                                              |
| ------------------------ | ---------------------------------------------------- |
| `@rune/database-core`    | `DatabaseAdapter`, lifecycle hooks, `DatabaseModule` |
| `@rune/database-drizzle` | `DrizzleAdapter`                                     |
| `@rune/database-prisma`  | `PrismaAdapter`                                      |

### QueueAdapter

```ts
import type { QueueAdapter } from "@rune/queue";

export class BullQueueAdapter implements QueueAdapter {
  async publish(queue: string, message: unknown): Promise<void> {
    await bullQueue.add(queue, message);
  }

  async subscribe(queue: string, handler: (message: unknown) => Promise<void>): Promise<void> {
    await bullQueue.process(queue, handler);
  }
}
```

### MailAdapter

```ts
import type { MailAdapter } from "@rune/mail";

export class SendGridAdapter implements MailAdapter {
  async send(options: { to: string; subject: string; body: string }): Promise<void> {
    await sendgrid.send({ to: options.to, subject: options.subject, text: options.body });
  }
}
```

### TelemetryAdapter

```ts
import type { TelemetryAdapter } from "@rune/telemetry";

export class DatadogAdapter implements TelemetryAdapter {
  trackEvent(name: string, properties?: Record<string, unknown>): void {
    datadog.logger.log(name, properties);
  }

  trackError(error: Error): void {
    datadog.logger.error(error.message, error.stack);
  }
}
```

## Packaging

Structure your adapter as a package with a clean public API:

```
my-adapter/
├── src/
│   └── index.ts      # Public exports
├── package.json      # Depend on @rune/core or relevant interface
├── tsconfig.json
└── tests/
    └── index.test.ts
```
