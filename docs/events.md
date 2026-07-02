---
title: Events
description: Event-driven architecture with the EventBus
sidebar:
  order: 6
---
## Overview

Rune provides an event pub/sub system through the `@rune/events` package. Decouple components by emitting events and registering listeners.

## Interface

```ts
interface EventAdapter {
  emit(event: string, payload: unknown): Promise<void>;
  on(event: string, handler: (payload: unknown) => void | Promise<void>): Promise<void>;
}
```

## MemoryEventBus

The built-in in-memory implementation:

```ts
import { MemoryEventBus } from "@rune/events";

const bus = new MemoryEventBus();
```

## Usage

### Emit and Listen

```ts
const bus = new MemoryEventBus();

// Register listener
await bus.on("user.created", async (payload) => {
  await sendWelcomeEmail(payload.email);
  await trackAnalytics("user_signup", payload.id);
});

// Emit event
await bus.emit("user.created", {
  id: 42,
  email: "alice@example.com",
  name: "Alice",
});
```

### Multiple Listeners

All listeners for an event run concurrently via `Promise.all`:

```ts
await bus.on("order.placed", sendConfirmationEmail);
await bus.on("order.placed", updateInventory);
await bus.on("order.placed", notifyShipping);

await bus.emit("order.placed", { orderId: 123, items: [...] });
// All three listeners run in parallel
```

## With DI

```ts
import { Module, Injectable, Deps } from "@rune/decorators";
import { MemoryEventBus, type EventAdapter } from "@rune/events";

@Injectable("singleton")
export class EventService {
  private readonly bus: EventAdapter = new MemoryEventBus();

  async emit(event: string, payload: unknown): Promise<void> {
    await this.bus.emit(event, payload);
  }

  async on(event: string, handler: (payload: unknown) => void | Promise<void>): Promise<void> {
    await this.bus.on(event, handler);
  }
}

@Injectable("singleton")
export class UserService {
  constructor(private events: EventService) {}

  async createUser(data: CreateUserDto) {
    const user = await db.users.insert(data);
    await this.events.emit("user.created", user);
    return user;
  }
}
```

## Custom Adapters

Implement the `EventAdapter` interface for Redis, RabbitMQ, SQS, etc.:

```ts
import type { EventAdapter } from "@rune/events";

export class RedisEventBus implements EventAdapter {
  constructor(private redis: Redis) {}

  async emit(event: string, payload: unknown): Promise<void> {
    await this.redis.publish(event, JSON.stringify(payload));
  }

  async on(event: string, handler: (payload: unknown) => void | Promise<void>): Promise<void> {
    const subscriber = this.redis.duplicate();
    await subscriber.subscribe(event, (message: string) => {
      handler(JSON.parse(message));
    });
  }
}
```

## Best Practices

- Use past-tense event names: `user.created`, `order.shipped`, `payment.failed`
- Keep payloads serializable (JSON-safe objects)
- Register listeners at startup (in module providers or app bootstrap)
- Handle errors inside listeners — an unhandled rejection in one listener does not affect others
- Use a dedicated event adapter for production workloads (Redis, RabbitMQ, etc.)


