import { describe, it, expect } from "bun:test";
import { onRequest } from "../index";
import type { PagesContext } from "@rune/adapter-cloudflare-pages";

describe("try-cloudflare-pages", () => {
  it("responds to GET /hello", async () => {
    const ctx = {
      request: new Request("http://localhost/hello"),
      env: {},
      params: {},
      data: {},
      next: async () => new Response("fallback"),
    } as PagesContext;

    const res = await onRequest(ctx);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ message: "Hello from Cloudflare Pages!" });
  });

  it("responds to POST /data with body", async () => {
    const ctx = {
      request: new Request("http://localhost/data", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ value: "test-data" }),
      }),
      env: {},
      params: {},
      data: {},
      next: async () => new Response("fallback"),
    } as PagesContext;

    const res = await onRequest(ctx);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ received: "test-data" });
  });

  it("returns 404 for unknown route", async () => {
    const ctx = {
      request: new Request("http://localhost/unknown"),
      env: {},
      params: {},
      data: {},
      next: async () => new Response("fallback"),
    } as PagesContext;

    const res = await onRequest(ctx);
    expect(res.status).toBe(404);
  });
});
