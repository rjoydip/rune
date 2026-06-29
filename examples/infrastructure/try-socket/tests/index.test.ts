import { describe, it, expect, beforeEach } from "bun:test";
import { SocketHandler } from "@rune/socket";
import app, { socketHandler } from "../index";

describe("try-socket", () => {
  beforeEach(() => {
    socketHandler.close();
  });

  it("reports status with zero connections", async () => {
    const res = await app.fetch(new Request("http://localhost/socket/status"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.connections).toBe(0);
    expect(body.message).toBe("Socket handler ready");
  });

  it("broadcasts via POST endpoint", async () => {
    const res = await app.fetch(
      new Request("http://localhost/socket/broadcast", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: "test broadcast" }),
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.sent).toBe(true);
    expect(body.message).toBe("test broadcast");
  });

  it("broadcasts with default message", async () => {
    const res = await app.fetch(
      new Request("http://localhost/socket/broadcast", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.message).toBe("default broadcast");
  });

  it("reports active connections after adding them", async () => {
    const conn = socketHandler.addConnection(SocketHandler.createConnection(() => {}));
    const res = await app.fetch(new Request("http://localhost/socket/status"));
    const body = await res.json();
    expect(body.connections).toBe(1);
    socketHandler.removeConnection(conn.id);
  });

  it("returns 404 for unknown route", async () => {
    const res = await app.fetch(new Request("http://localhost/unknown"));
    expect(res.status).toBe(404);
  });
});
