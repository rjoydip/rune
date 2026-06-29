import { describe, it, expect, beforeEach } from "bun:test";
import { SocketHandler } from "../src/socket-handler";
import type { SocketConnection, SocketMessage } from "../src/adapter";

describe("SocketHandler", () => {
  let handler: SocketHandler;

  beforeEach(() => {
    handler = new SocketHandler();
  });

  describe("connection lifecycle", () => {
    it("starts with zero connections", () => {
      expect(handler.connections).toBe(0);
    });

    it("tracks connection count", () => {
      handler.addConnection(SocketHandler.createConnection(() => {}));
      expect(handler.connections).toBe(1);
    });

    it("removes connections", () => {
      const conn = SocketHandler.createConnection(() => {});
      handler.addConnection(conn);
      handler.removeConnection(conn.id);
      expect(handler.connections).toBe(0);
    });
  });

  describe("events", () => {
    it("emits connection event", () => {
      let emitted: SocketConnection | null = null;
      handler.on("connection", (c) => {
        emitted = c;
      });
      const conn = SocketHandler.createConnection(() => {});
      handler.addConnection(conn);
      expect(emitted!.id).toBe(conn.id);
    });

    it("emits close event", () => {
      let emitted: SocketConnection | null = null;
      handler.on("close", (c) => {
        emitted = c;
      });
      const conn = SocketHandler.createConnection(() => {});
      handler.addConnection(conn);
      handler.removeConnection(conn.id);
      expect(emitted!.id).toBe(conn.id);
    });

    it("emits message event", () => {
      let received: { conn: SocketConnection; msg: SocketMessage } | null = null;
      handler.on("message", (c, m) => {
        received = { conn: c, msg: m };
      });
      const conn = SocketHandler.createConnection(() => {});
      handler.addConnection(conn);
      handler.dispatchMessage(conn.id, { type: "text", data: "hello" });
      expect(received!.conn.id).toBe(conn.id);
      expect(received!.msg.data).toBe("hello");
    });

    it("emits error event", () => {
      let received: { conn: SocketConnection; error: Error } | null = null;
      handler.on("error", (c, e) => {
        received = { conn: c, error: e };
      });
      const conn = SocketHandler.createConnection(() => {});
      handler.addConnection(conn);
      handler.dispatchError(conn.id, new Error("test error"));
      expect(received!.conn.id).toBe(conn.id);
      expect(received!.error.message).toBe("test error");
    });
  });

  describe("broadcast", () => {
    it("sends data to all connections", () => {
      const received: string[] = [];
      const conn1 = SocketHandler.createConnection((d) => received.push(`a:${d}`));
      const conn2 = SocketHandler.createConnection((d) => received.push(`b:${d}`));
      handler.addConnection(conn1);
      handler.addConnection(conn2);
      handler.broadcast("hello");
      expect(received.sort()).toEqual(["a:hello", "b:hello"]);
    });

    it("does not fail when no connections", () => {
      handler.broadcast("hello");
      expect(handler.connections).toBe(0);
    });

    it("catches send errors gracefully", () => {
      const failingConn = SocketHandler.createConnection(() => {
        throw new Error("send failed");
      });
      handler.addConnection(failingConn);
      expect(() => handler.broadcast("try")).not.toThrow();
    });
  });

  describe("handleUpgrade", () => {
    it("returns 426 for built-in handler", () => {
      const req = new Request("http://localhost/socket");
      const res = handler.handleUpgrade(req);
      expect(res.status).toBe(426);
    });
  });

  describe("close", () => {
    it("closes all connections", () => {
      const conn1 = SocketHandler.createConnection(() => {});
      const conn2 = SocketHandler.createConnection(() => {});
      handler.addConnection(conn1);
      handler.addConnection(conn2);
      handler.close();
      expect(handler.connections).toBe(0);
    });

    it("catches close errors gracefully", () => {
      const failingConn = SocketHandler.createConnection(() => {});
      const originalClose = failingConn.close;
      failingConn.close = () => {
        throw new Error("close failed");
      };
      handler.addConnection(failingConn);
      expect(() => handler.close()).not.toThrow();
      failingConn.close = originalClose;
    });
  });

  describe("createConnection", () => {
    it("creates unique connection IDs", () => {
      const c1 = SocketHandler.createConnection(() => {});
      const c2 = SocketHandler.createConnection(() => {});
      expect(c1.id).not.toBe(c2.id);
    });

    it("sends data via implementation function", () => {
      let sent = "";
      const conn = SocketHandler.createConnection((d) => {
        sent = d;
      });
      conn.send("test");
      expect(sent).toBe("test");
    });

    it("ignores send after close", () => {
      let sent = "";
      const conn = SocketHandler.createConnection((d) => {
        sent = d;
      });
      conn.close();
      conn.send("should not arrive");
      expect(sent).toBe("");
    });
  });
});
