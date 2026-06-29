import { describe, it, expect } from "bun:test";
import handler from "../api/index";

describe("try-vercel", () => {
  it("responds to GET /hello", async () => {
    const req = new Request("http://localhost/hello");
    const res = await handler(req);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ message: "Hello from Vercel!" });
  });

  it("responds to POST /data with body", async () => {
    const req = new Request("http://localhost/data", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ value: "test-data" }),
    });
    const res = await handler(req);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ received: "test-data" });
  });

  it("returns 404 for unknown route", async () => {
    const req = new Request("http://localhost/unknown");
    const res = await handler(req);
    expect(res.status).toBe(404);
  });
});
