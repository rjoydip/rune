import { describe, it, expect } from "bun:test";
import type { ExecutionContext } from "@cloudflare/workers-types";
import worker from "../index";

describe("try-cloudflare-workers", () => {
  it("responds to GET /hello", async () => {
    const req = new Request("http://localhost/hello");
    const res = await worker.fetch(req, {}, {
      waitUntil: () => {},
      passThroughOnException: () => {},
    } as unknown as ExecutionContext);
    expect(res.status).toBe(200);
    expect(JSON.parse(await res.text())).toEqual({ message: "Hello from Cloudflare Workers!" });
  });

  it("responds to POST /data with body", async () => {
    const req = new Request("http://localhost/data", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ value: "test-data" }),
    });
    const res = await worker.fetch(req, {}, {
      waitUntil: () => {},
      passThroughOnException: () => {},
    } as unknown as ExecutionContext);
    expect(res.status).toBe(200);
    expect(JSON.parse(await res.text())).toEqual({ received: "test-data" });
  });

  it("returns 404 for unknown route", async () => {
    const req = new Request("http://localhost/unknown");
    const res = await worker.fetch(req, {}, {
      waitUntil: () => {},
      passThroughOnException: () => {},
    } as unknown as ExecutionContext);
    expect(res.status).toBe(404);
  });
});
