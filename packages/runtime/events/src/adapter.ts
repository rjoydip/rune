/**
 * Interface for event pub/sub adapters.
 * Implementations provide the underlying event dispatch mechanism.
 */
export interface EventAdapter {
  /**
   * Emit an event with a payload to all registered listeners.
   * @param event - The event name.
   * @param payload - The data to pass to listeners.
   *
   * @example
   * ```ts
   * await bus.emit("user.created", { id: 1, name: "Alice" });
   * ```
   */
  emit(event: string, payload: unknown): Promise<void>;
  /**
   * Register a handler for a specific event.
   * @param event - The event name to listen for.
   * @param handler - Callback invoked when the event is emitted.
   *
   * @example
   * ```ts
   * await bus.on("user.created", async (payload) => {
   *   await sendWelcomeEmail(payload);
   * });
   * ```
   */
  on(event: string, handler: (payload: unknown) => void | Promise<void>): Promise<void>;
}
