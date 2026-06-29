/**
 * Represents a single WebSocket connection with a unique identifier,
 * send capability, and close control.
 *
 * @example
 * ```ts
 * const conn: SocketConnection = {
 *   id: "conn_1",
 *   send(data) { console.log("send:", data); },
 *   close(code) { console.log("close:", code); },
 * };
 * conn.send("hello");
 * conn.close(1000);
 * ```
 */
export interface SocketConnection {
  /** Unique connection identifier. */
  id: string;
  /** Send a text message to this connection. */
  send(data: string): void;
  /**
   * Close the connection.
   * @param code - WebSocket close code (default 1000).
   * @param reason - Close reason text.
   */
  close(code?: number, reason?: string): void;
}

/**
 * A message received over a socket connection.
 *
 * @example
 * ```ts
 * const msg: SocketMessage = {
 *   type: "text",
 *   data: "ping",
 * };
 * ```
 */
export interface SocketMessage {
  /** Message type: text or binary. */
  type: "text" | "binary";
  /** Message payload as a string or ArrayBuffer. */
  data: string | ArrayBuffer;
}

/**
 * Interface for socket server adapters.
 *
 * Concrete implementations handle WebSocket upgrades, broadcasting,
 * connection tracking, and lifecycle events.
 *
 * @example
 * ```ts
 * class MyAdapter implements SocketAdapter {
 *   private connections = new Map<string, SocketConnection>();
 *
 *   handleUpgrade(_req: Request): Response {
 *     return new Response(null, { status: 426 });
 *   }
 *
 *   broadcast(data: string): void {
 *     for (const c of this.connections.values()) c.send(data);
 *   }
 *
 *   get connections(): number {
 *     return this.connections.size;
 *   }
 *
 *   close(): void {
 *     this.connections.clear();
 *   }
 *
 *   on(event: "connection", handler: (conn: SocketConnection) => void): void {
 *     // register handler
 *   }
 *
 *   on(_event: never, _handler: never): void {
 *     // no-op
 *   }
 * }
 * ```
 */
export interface SocketAdapter {
  /**
   * Handle an HTTP upgrade request to WebSocket.
   * @param request - The incoming HTTP request.
   * @returns A Response (upgraded or error).
   */
  handleUpgrade(request: Request): Promise<Response> | Response;

  /**
   * Send a message string to every connected client.
   * @param data - The string payload to broadcast.
   */
  broadcast(data: string): void;

  /** The number of currently active connections. */
  readonly connections: number;

  /** Close all connections and shut down the server. */
  close(): void;

  /**
   * Register an event handler.
   * @param event - Event name: "connection", "close", "message", or "error".
   * @param handler - Callback invoked when the event fires.
   */
  on(event: "connection", handler: (conn: SocketConnection) => void): void;
  on(event: "close", handler: (conn: SocketConnection) => void): void;
  on(event: "message", handler: (conn: SocketConnection, msg: SocketMessage) => void): void;
  on(event: "error", handler: (conn: SocketConnection, error: Error) => void): void;
}
