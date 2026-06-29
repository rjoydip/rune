import { describe, it, expect } from "bun:test";
import { toCloudflarePagesFunction } from "../src/index";
import type { RuneApp } from "@rune/core";
import type { PagesContext } from "../src/index";

describe("adapter-cloudflare-pages", () => {
  it("exports toCloudflarePagesFunction", () => {
    expect(toCloudflarePagesFunction).toBeTypeOf("function");
  });

  it("returns a function that accepts PagesContext", () => {
    const app = { fetch: async () => new Response("ok") } as unknown as RuneApp;
    const handler = toCloudflarePagesFunction(app);
    expect(handler).toBeTypeOf("function");
    expect(handler.length).toBe(1);
  });

  it("calls app.fetch with request from context", async () => {
    let capturedRequest: Request | undefined;
    const app = {
      fetch: async (req: Request) => {
        capturedRequest = req;
        return new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      },
    } as unknown as RuneApp;
    const handler = toCloudflarePagesFunction(app);
    const context = {
      request: new Request("http://localhost/users/123"),
      env: {},
      params: { id: "123" },
      data: {},
      next: async () => new Response("fallback"),
    } as PagesContext;

    const res = await handler(context);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(capturedRequest!.url).toBe("http://localhost/users/123");
  });

  it("handles POST request", async () => {
    const app = {
      fetch: async (req: Request) => {
        expect(req.method).toBe("POST");
        return new Response(await req.text(), { status: 201 });
      },
    } as unknown as RuneApp;
    const handler = toCloudflarePagesFunction(app);
    const context = {
      request: new Request("http://localhost/data", {
        method: "POST",
        body: JSON.stringify({ key: "val" }),
        headers: { "content-type": "application/json" },
      }),
      env: {},
      params: {},
      data: {},
      next: async () => new Response("fallback"),
    } as PagesContext;

    const res = await handler(context);
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ key: "val" });
  });

  it("propagates error status codes", async () => {
    const app = {
      fetch: async () => new Response("Not Found", { status: 404 }),
    } as unknown as RuneApp;
    const handler = toCloudflarePagesFunction(app);
    const context = {
      request: new Request("http://localhost/missing"),
      env: {},
      params: {},
      data: {},
      next: async () => new Response("fallback"),
    } as PagesContext;

    const res = await handler(context);
    expect(res.status).toBe(404);
  });
});
