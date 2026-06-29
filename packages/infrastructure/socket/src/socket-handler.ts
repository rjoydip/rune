import type { SocketAdapter, SocketConnection, SocketMessage } from "./adapter.ts";

interface ConnectionEntry {
  conn: SocketConnection;
}

type EventMap = {
  connection: (conn: SocketConnection) => void;
  close: (conn: SocketConnection) => void;
  message: (conn: SocketConnection, msg: SocketMessage) => void;
  error: (conn: SocketConnection, error: Error) => void;
};

let connectionCounter = 0;

type EventHandler = (...args: unknown[]) => void;

/**
 * Built-in implementation of the SocketAdapter interface.
 *
 * Manages connections in an in-memory map and dispatches lifecycle events
 * to registered handlers. Does **not** perform actual WebSocket upgrades
 * (returns 426 by default); intended as a base or mock adapter.
 *
 * @example
 * ```ts
 * const handler = new SocketHandler();
 * handler.on("connection", (conn) => {
 *   console.log("connected:", conn.id);
 * });
 * handler.on("message", (conn, msg) => {
 *   console.log("message:", msg.data);
 * });
 * const conn = handler.addConnection(
 *   SocketHandler.createConnection((data) => console.log("send:", data)),
 * );
 * handler.dispatchMessage(conn.id, { type: "text", data: "hello" });
 * ```
 */
export class SocketHandler implements SocketAdapter {
  private readonly connectionMap = new Map<string, ConnectionEntry>();
  private readonly listeners = new Map<string, Set<EventHandler>>();

  /**
   * Handle an HTTP upgrade request. Built-in implementation returns 426.
   * @param _request - The incoming HTTP request.
   * @returns A 426 Response indicating upgrade is not supported.
   *
   * @example
   * ```ts
   * const res = handler.handleUpgrade(new Request("http://localhost"));
   * res.status; // 426
   * ```
   */
  handleUpgrade(_request: Request): Response {
    return new Response("WebSocket upgrade not supported by built-in handler", {
      status: 426,
      headers: { "content-type": "text/plain" },
    });
  }

  /**
   * Send a string to every connected client.
   * Failed sends are silently ignored.
   * @param data - The string payload.
   *
   * @example
   * ```ts
   * handler.broadcast("announcement");
   * ```
   */
  broadcast(data: string): void {
    for (const [, entry] of this.connectionMap) {
      try {
        entry.conn.send(data);
      } catch {
        // connection may be closed
      }
    }
  }

  /** The number of currently active connections. */
  get connections(): number {
    return this.connectionMap.size;
  }

  /**
   * Close all connections with code 1001 and clear the connection map.
   *
   * @example
   * ```ts
   * handler.close();
   * handler.connections; // 0
   * ```
   */
  close(): void {
    for (const [id, entry] of this.connectionMap) {
      try {
        entry.conn.close(1001, "Server shutting down");
      } catch {
        // ignore
      }
      this.connectionMap.delete(id);
      this.dispatchEvent("close", entry.conn);
    }
  }

  /**
   * Register an event handler.
   * @param event - Event name to listen for.
   * @param handler - Callback to invoke when the event fires.
   *
   * @example
   * ```ts
   * handler.on("connection", (conn) => console.log("new conn:", conn.id));
   * handler.on("close", (conn) => console.log("closed:", conn.id));
   * handler.on("message", (conn, msg) => console.log("msg:", msg.data));
   * ```
   */
  on<E extends keyof EventMap>(event: E, handler: EventMap[E]): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler as EventHandler);
  }

  /**
   * Register a new connection and emit the "connection" event.
   * @param conn - The connection to add.
   * @returns The same connection object.
   *
   * @example
   * ```ts
   * const conn = SocketHandler.createConnection((d) => {});
   * handler.addConnection(conn);
   * ```
   */
  addConnection(conn: SocketConnection): SocketConnection {
    this.connectionMap.set(conn.id, { conn });
    this.dispatchEvent("connection", conn);
    return conn;
  }

  /**
   * Remove a connection by ID and emit the "close" event.
   * @param id - The connection identifier.
   *
   * @example
   * ```ts
   * handler.removeConnection("conn_1");
   * ```
   */
  removeConnection(id: string): void {
    const entry = this.connectionMap.get(id);
    if (entry) {
      this.connectionMap.delete(id);
      this.dispatchEvent("close", entry.conn);
    }
  }

  /**
   * Dispatch a message event for a given connection.
   * @param id - The connection identifier.
   * @param msg - The incoming message.
   *
   * @example
   * ```ts
   * handler.dispatchMessage("conn_1", { type: "text", data: "ping" });
   * ```
   */
  dispatchMessage(id: string, msg: SocketMessage): void {
    const entry = this.connectionMap.get(id);
    if (entry) {
      this.dispatchEvent("message", entry.conn, msg);
    }
  }

  /**
   * Dispatch an error event for a given connection.
   * @param id - The connection identifier.
   * @param error - The error to report.
   *
   * @example
   * ```ts
   * handler.dispatchError("conn_1", new Error("timeout"));
   * ```
   */
  dispatchError(id: string, error: Error): void {
    const entry = this.connectionMap.get(id);
    if (entry) {
      this.dispatchEvent("error", entry.conn, error);
    }
  }

  /**
   * Create a new SocketConnection with an auto-generated ID.
   * The returned connection guards against sending or closing after
   * it has been closed once.
   * @param sendImpl - Function called when the connection sends data.
   * @returns A new SocketConnection instance.
   *
   * @example
   * ```ts
   * const conn = SocketHandler.createConnection((data) => {
   *   ws.send(data);
   * });
   * conn.send("hello");
   * conn.close(1000);
   * conn.send("ignored"); // no-op, already closed
   * ```
   */
  static createConnection(sendImpl: (data: string) => void): SocketConnection {
    const id = `conn_${++connectionCounter}`;
    let closed = false;

    return {
      id,
      send(data: string) {
        if (!closed) {
          sendImpl(data);
        }
      },
      close(_code?: number, _reason?: string) {
        if (!closed) {
          closed = true;
        }
      },
    };
  }

  private dispatchEvent(event: string, ...args: unknown[]): void {
    const handlers = this.listeners.get(event);
    if (!handlers) return;
    for (const handler of handlers) {
      handler(...args);
    }
  }
}
