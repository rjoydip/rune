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

// External implementations
import { DrizzleAdapter } from "@rune/db-drizzle";
import { PrismaAdapter } from "@rune/db-prisma";
import { KyselyAdapter } from "@rune/db-kysely";
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
