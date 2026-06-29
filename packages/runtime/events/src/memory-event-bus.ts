import type { EventAdapter } from "./adapter.js";

/**
 * In-memory implementation of the EventAdapter interface.
 * Stores listeners in a Map and invokes them using Promise.all when events are emitted.
 *
 * @example
 * ```ts
 * const bus = new MemoryEventBus();
 * await bus.on("order.placed", handleOrder);
 * await bus.emit("order.placed", { orderId: 123 });
 * ```
 */
export class MemoryEventBus implements EventAdapter {
  private readonly listeners = new Map<string, ((payload: unknown) => void | Promise<void>)[]>();

  /**
   * Emit an event, invoking all registered listeners concurrently.
   * @param event - The event name.
   * @param payload - The data to pass to each listener.
   *
   * @example
   * ```ts
   * await bus.emit("user.login", { userId: 42, timestamp: Date.now() });
   * ```
   */
  async emit(event: string, payload: unknown): Promise<void> {
    const handlers = this.listeners.get(event);
    if (!handlers) return;

    await Promise.all(handlers.map((handler) => handler(payload)));
  }

  /**
   * Register a listener for a given event.
   * @param event - The event name to listen for.
   * @param handler - Callback invoked with the payload when the event is emitted.
   *
   * @example
   * ```ts
   * await bus.on("order.shipped", async (data) => {
   *   await notifyCustomer(data.email, data.tracking);
   * });
   * ```
   */
  async on(event: string, handler: (payload: unknown) => void | Promise<void>): Promise<void> {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(handler);
  }
}
