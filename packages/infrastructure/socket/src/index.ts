/**
 * Re-export the SocketAdapter interface for custom adapter implementations.
 *
 * @example
 * ```ts
 * import type { SocketAdapter } from "@rune/socket";
 * class MyAdapter implements SocketAdapter { ... }
 * ```
 */
export type { SocketAdapter } from "./adapter.js";

/**
 * Re-export the SocketConnection interface representing a single connection.
 *
 * @example
 * ```ts
 * import type { SocketConnection } from "@rune/socket";
 * function logConn(conn: SocketConnection): void {
 *   console.log(conn.id);
 * }
 * ```
 */
export type { SocketConnection } from "./adapter.js";

/**
 * Re-export the SocketMessage interface for incoming message payloads.
 *
 * @example
 * ```ts
 * import type { SocketMessage } from "@rune/socket";
 * function handleMsg(msg: SocketMessage): void {
 *   if (msg.type === "text") console.log(msg.data);
 * }
 * ```
 */
export type { SocketMessage } from "./adapter.js";

/**
 * Re-export the SocketHandler class, a built-in in-memory adapter.
 *
 * @example
 * ```ts
 * import { SocketHandler } from "@rune/socket";
 * const handler = new SocketHandler();
 * ```
 */
export { SocketHandler } from "./socket-handler.js";
