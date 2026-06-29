import { describe, it, expect } from "bun:test";
import type { QueueAdapter } from "@rune/queue";

describe("try-queue", () => {
  it("publishes and consumes messages", async () => {
    const received: string[] = [];
    const queue: QueueAdapter = {
      async publish(_q: string, msg: unknown) {
        received.push(msg as string);
      },
      async consume() {},
    };
    await queue.publish("test", "hello");
    expect(received).toEqual(["hello"]);
  });

  it("consume handler receives messages", async () => {
    const received: string[] = [];
    const queue: QueueAdapter = {
      async publish(_q: string, msg: unknown) {
        received.push(msg as string);
      },
      async consume(_q: string, handler: (msg: unknown) => void | Promise<void>) {
        await handler("delivered");
      },
    };
    const messages: string[] = [];
    await queue.consume("test", (msg) => {
      messages.push(msg as string);
    });
    expect(messages).toEqual(["delivered"]);
  });
});
