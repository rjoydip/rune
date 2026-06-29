import type { QueueAdapter } from "@rune/queue";

class InMemoryQueue implements QueueAdapter {
  private handlers = new Map<string, (payload: unknown) => void | Promise<void>>();

  async publish(queue: string, payload: unknown): Promise<void> {
    const handler = this.handlers.get(queue);
    if (handler) await handler(payload);
  }

  async consume(queue: string, handler: (payload: unknown) => void | Promise<void>): Promise<void> {
    this.handlers.set(queue, handler);
  }
}

const queue = new InMemoryQueue();
await queue.consume("emails", async (msg) => {
  console.log(`Sending email: ${msg}`);
});
await queue.publish("emails", "Welcome to Rune!");
