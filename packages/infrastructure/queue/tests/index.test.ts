import { describe, it, expect } from "bun:test";
import type { QueueAdapter } from "../src/index";

describe("QueueAdapter type", () => {
  it("is a valid interface", () => {
    const adapter: QueueAdapter = {
      async publish() {},
      async consume() {},
    };
    expect(adapter).toBeDefined();
    expect(typeof adapter.publish).toBe("function");
    expect(typeof adapter.consume).toBe("function");
  });
});

describe("mock in-memory queue", () => {
  interface QueuedMessage {
    queue: string;
    payload: unknown;
  }

  function createMemoryQueue(): QueueAdapter {
    const messages: QueuedMessage[] = [];
    const handlers = new Map<string, (payload: unknown) => void | Promise<void>>();

    return {
      async publish(queue: string, payload: unknown) {
        messages.push({ queue, payload });
        const handler = handlers.get(queue);
        if (handler) {
          await handler(payload);
        }
      },
      async consume(queue: string, handler: (payload: unknown) => void | Promise<void>) {
        handlers.set(queue, handler);
      },
      // expose for testing
      getMessages() {
        return messages;
      },
      getHandler(queue: string) {
        return handlers.get(queue);
      },
    } as QueueAdapter & {
      getMessages(): QueuedMessage[];
      getHandler(queue: string): ((payload: unknown) => void | Promise<void>) | undefined;
    };
  }

  it("publish adds a message to the queue", async () => {
    const queue = createMemoryQueue();
    await queue.publish("orders", { id: 1 });
    const messages = (queue as any).getMessages();
    expect(messages).toHaveLength(1);
    expect(messages[0].queue).toBe("orders");
  });

  it("consume receives published messages", async () => {
    const queue = createMemoryQueue();
    const received: unknown[] = [];
    await queue.consume("orders", (p) => void received.push(p));
    const handler = (queue as any).getHandler("orders");
    expect(handler).toBeDefined();
  });

  it("consume callback is invoked with payload", async () => {
    const queue = createMemoryQueue();
    const received: unknown[] = [];
    await queue.consume("events", (p) => void received.push(p));
    await queue.publish("events", "hello");
    expect(received).toHaveLength(1);
    expect(received[0]).toBe("hello");
  });

  it("consume works with async handler", async () => {
    const queue = createMemoryQueue();
    const received: unknown[] = [];
    await queue.consume("async", async (p) => {
      await Promise.resolve();
      void received.push(p);
    });
    await queue.publish("async", "val");
    expect(received).toHaveLength(1);
    expect(received[0]).toBe("val");
  });

  it("multiple messages are queued in order", async () => {
    const queue = createMemoryQueue();
    const received: unknown[] = [];
    await queue.consume("q", (p) => void received.push(p));
    await queue.publish("q", "a");
    await queue.publish("q", "b");
    await queue.publish("q", "c");
    expect(received).toEqual(["a", "b", "c"]);
  });
});
