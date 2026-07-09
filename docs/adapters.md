---
title: Adapters
description: Cache, Queue, Database, Mail, and other infrastructure adapters
sidebar:
  order: 2
---

## Overview

Infrastructure adapters allow swapping implementations without changing application code.

## Cache

```ts
import { CacheAdapter } from "@rune/cache";

interface CacheAdapter {
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: unknown, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
}

// Built-in
import { MemoryCache } from "@rune/cache";

// External implementations
import { RedisCache } from "@rune/cache-redis";
import { CloudflareKVCache } from "@rune/cache-kv";
import { UpstashCache } from "@rune/cache-upstash";
```

## Logger

```ts
import { LoggerAdapter } from "@rune/logger";

interface LoggerAdapter {
  info(...args: unknown[]): void;
  warn(...args: unknown[]): void;
  error(...args: unknown[]): void;
  debug(...args: unknown[]): void;
}

// Built-in
import { ConsoleLogger } from "@rune/logger";

// External implementations
import { PinoLogger } from "@rune/logger-pino";
import { WinstonLogger } from "@rune/logger-winston";
```

## Events

```ts
import { EventAdapter } from "@rune/events";

interface EventAdapter {
  emit(event: string, payload: unknown): Promise<void>;
  on(event: string, handler: Function): Promise<void>;
}

// Built-in
import { MemoryEventBus } from "@rune/events";

// External implementations
import { RedisEventBus } from "@rune/events-redis";
import { KafkaEventBus } from "@rune/events-kafka";
import { NATSEventBus } from "@rune/events-nats";
```

## Queue

```ts
import { QueueAdapter } from "@rune/queue";

interface QueueAdapter {
  publish(queue: string, payload: unknown): Promise<void>;
  consume(queue: string, handler: Function): Promise<void>;
}

// External implementations
import { BullMQQueue } from "@rune/queue-bullmq";
import { SQSQueue } from "@rune/queue-sqs";
import { CloudflareQueue } from "@rune/queue-cf";
```

## Database

```ts
import { DatabaseAdapter } from "@rune/database";

interface DatabaseAdapter {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
}
```

### Built-in adapters

The `@rune/database` umbrella package re-exports from sub-packages. You can use the umbrella or import directly:

```ts
import { DrizzleAdapter } from "@rune/database";
// Or directly:
import { DrizzleAdapter } from "@rune/database-drizzle";
import { PrismaAdapter } from "@rune/database-prisma";
import type { DatabaseAdapter } from "@rune/database-core";
```

Built-in ORM adapters:

#### DrizzleAdapter

```ts
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { DrizzleAdapter } from "@rune/database";

const sqlite = new Database("app.db");
const db = drizzle(sqlite);
const adapter = new DrizzleAdapter(db);

// Lifecycle (auto-wired via RuneApp)
await adapter.connect();
// ... use adapter.client for native Drizzle queries
await adapter.disconnect();
```

#### PrismaAdapter

```ts
import { PrismaClient } from "@prisma/client";
import { PrismaAdapter } from "@rune/database";

const prisma = new PrismaClient();
const adapter = new PrismaAdapter(prisma);

// Lifecycle (auto-wired via RuneApp)
await adapter.connect(); // calls prisma.$connect()
await adapter.disconnect(); // calls prisma.$disconnect()

// Query using native Prisma API
const users = await adapter.client.user.findMany();
```

### Lifecycle hooks

Adapters implement `OnAppInit` / `OnAppDestroy` for automatic lifecycle wiring:

```ts
const app = createApp();

// Register lifecycle hooks
app.onInit(() => adapter.onAppInit());
app.onDestroy(() => adapter.onAppDestroy());

await app.init(); // calls adapter.connect()
await app.destroy(); // calls adapter.disconnect()
```

### Example: Module integration

```ts
import { DrizzleAdapter } from "@rune/database";

@Deps(DrizzleAdapter)
class PostService {
  constructor(private db: DrizzleAdapter<any>) {}

  async getPosts() {
    return this.db.client.select().from(postsTable).all();
  }
}

@Module({
  controllers: [PostController],
  providers: [PostService, DrizzleAdapter],
})
class BlogModule {}
```

## Mail

```ts
import { MailAdapter, MailMessage } from "@rune/mail";

interface MailAdapter {
  send(message: MailMessage): Promise<void>;
}

// External implementations
import { ResendAdapter } from "@rune/mail-resend";
import { SESAdapter } from "@rune/mail-ses";
import { SendGridAdapter } from "@rune/mail-sendgrid";
```

## Socket

```ts
import { SocketAdapter, SocketHandler } from "@rune/socket";

interface SocketAdapter {
  handleUpgrade(request: Request): Promise<Response> | Response;
  broadcast(data: string): void;
  readonly connections: number;
  close(): void;
  on(event: "connection", handler: (conn: SocketConnection) => void): void;
  on(event: "message", handler: (conn: SocketConnection, msg: SocketMessage) => void): void;
  on(event: "close", handler: (conn: SocketConnection) => void): void;
  on(event: "error", handler: (conn: SocketConnection, error: Error) => void): void;
}

// Built-in
import { SocketHandler } from "@rune/socket";

// External implementations
import { WsAdapter } from "@rune/socket-ws";
import { SocketIOAdapter } from "@rune/socket-io";
```

## GraphQL

```ts
import { GraphQLAdapter, GraphQLHandler } from "@rune/graphql";

interface GraphQLAdapter {
  execute(query: string, variables?: Record<string, unknown>): Promise<ExecutionResult>;
  handleRequest(request: Request): Promise<Response>;
}

// Built-in
import { GraphQLHandler } from "@rune/graphql";

// External implementations
import { YogaAdapter } from "@rune/graphql-yoga";
import { ApolloAdapter } from "@rune/graphql-apollo";
```

## Telemetry

```ts
import { TelemetryAdapter } from "@rune/telemetry";

interface TelemetryAdapter {
  startSpan(name: string): Span;
  recordException(error: Error): void;
}

// Built-in
import { NoopTelemetry } from "@rune/telemetry";

// External implementations
import { OTelAdapter } from "@rune/otel";
import { DatadogAdapter } from "@rune/datadog";
```

## Custom Adapter

Implement any interface:

```ts
import { CacheAdapter } from "@rune/cache";

export class MyCustomCache implements CacheAdapter {
  async get<T>(key: string): Promise<T | null> {
    // Your implementation
  }
  async set(key: string, value: unknown, ttl?: number): Promise<void> {
    // Your implementation
  }
  async delete(key: string): Promise<void> {}
  async clear(): Promise<void> {}
}
```
