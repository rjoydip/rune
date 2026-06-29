import { describe, it, expect, mock } from "bun:test";
import { toKoaMiddleware } from "../src/index";
import type { RuneApp } from "@rune/core";

describe("adapter-koa", () => {
  it("exports toKoaMiddleware function", () => {
    expect(toKoaMiddleware).toBeTypeOf("function");
  });

  it("returns a middleware function", () => {
    const app = { fetch: async () => new Response("ok") } as unknown as RuneApp;
    const middleware = toKoaMiddleware(app);
    expect(middleware).toBeTypeOf("function");
  });

  it("handles GET request through koa middleware", async () => {
    const app = {
      fetch: async () =>
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
    } as unknown as RuneApp;

    const middleware = toKoaMiddleware(app);

    const ctx: any = {
      protocol: "http",
      host: "localhost",
      url: "/test",
      method: "GET",
      headers: { host: "localhost" },
      request: { body: {} },
      set: mock(() => {}),
      status: 0,
      body: "",
    };

    await middleware(ctx, () => Promise.resolve());

    expect(ctx.status).toBe(200);
    expect(ctx.set).toHaveBeenCalledWith("content-type", "application/json");
    expect(ctx.body).toBe(JSON.stringify({ ok: true }));
  });

  it("handles POST request with JSON body", async () => {
    const app = {
      fetch: async (req: Request) =>
        new Response(await req.text(), {
          status: 201,
          headers: { "x-id": "123" },
        }),
    } as unknown as RuneApp;

    const middleware = toKoaMiddleware(app);

    const ctx: any = {
      protocol: "https",
      host: "api.test",
      url: "/data",
      method: "POST",
      headers: { "content-type": "application/json" },
      request: { body: { name: "test" } },
      set: mock(() => {}),
      status: 0,
      body: "",
    };

    await middleware(ctx, () => Promise.resolve());

    expect(ctx.status).toBe(201);
    expect(ctx.set).toHaveBeenCalledWith("x-id", "123");
    expect(ctx.body).toBe(JSON.stringify({ name: "test" }));
  });

  it("handles PUT request with body", async () => {
    const app = {
      fetch: async (req: Request) => new Response(await req.text(), { status: 200 }),
    } as unknown as RuneApp;

    const middleware = toKoaMiddleware(app);

    const ctx: any = {
      protocol: "http",
      host: "localhost",
      url: "/update",
      method: "PUT",
      headers: { "content-type": "application/json" },
      request: { body: { id: 1 } },
      set: mock(() => {}),
      status: 0,
      body: "",
    };

    await middleware(ctx, () => Promise.resolve());

    expect(ctx.status).toBe(200);
    expect(ctx.body).toBe(JSON.stringify({ id: 1 }));
  });

  it("handles DELETE request", async () => {
    const app = {
      fetch: async (req: Request) => {
        expect(req.method).toBe("DELETE");
        return new Response(null, { status: 204 });
      },
    } as unknown as RuneApp;

    const middleware = toKoaMiddleware(app);

    const ctx: any = {
      protocol: "http",
      host: "localhost",
      url: "/resource",
      method: "DELETE",
      headers: {},
      request: { body: null },
      set: mock(() => {}),
      status: 0,
      body: "",
    };

    await middleware(ctx, () => Promise.resolve());

    expect(ctx.status).toBe(204);
    expect(ctx.body).toBe("");
  });

  it("handles error response", async () => {
    const app = {
      fetch: async () =>
        new Response(JSON.stringify({ error: "unauthorized" }), {
          status: 401,
          headers: { "content-type": "application/json" },
        }),
    } as unknown as RuneApp;

    const middleware = toKoaMiddleware(app);

    const ctx: any = {
      protocol: "http",
      host: "localhost",
      url: "/admin",
      method: "GET",
      headers: {},
      request: { body: {} },
      set: mock(() => {}),
      status: 0,
      body: "",
    };

    await middleware(ctx, () => Promise.resolve());

    expect(ctx.status).toBe(401);
    expect(ctx.set).toHaveBeenCalledWith("content-type", "application/json");
    expect(ctx.body).toBe(JSON.stringify({ error: "unauthorized" }));
  });
});
