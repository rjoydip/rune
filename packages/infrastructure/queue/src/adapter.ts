/**
 * Queue adapter interface.
 * Provides a generic contract for publishing and consuming messages via a message queue.
 */
export interface QueueAdapter {
  /**
   * Publish a message to the specified queue.
   * @param queue - The name of the target queue.
   * @param payload - The message payload.
   *
   * @example
   * ```ts
   * await queue.publish("orders", { orderId: "123", amount: 49.99 });
   * ```
   */
  publish(queue: string, payload: unknown): Promise<void>;

  /**
   * Subscribe to consume messages from the specified queue.
   * @param queue - The name of the queue to consume from.
   * @param handler - A callback invoked for each message received.
   *
   * @example
   * ```ts
   * await queue.consume("orders", (payload) => {
   *   console.log("Received order", payload);
   * });
   * ```
   */
  consume(queue: string, handler: (payload: unknown) => void | Promise<void>): Promise<void>;
}
