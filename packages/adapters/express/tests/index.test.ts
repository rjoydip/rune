import { describe, it, expect, mock } from "bun:test";
import { toExpress } from "../src/index";
import type { RuneApp } from "@rune/core";

describe("adapter-express", () => {
  it("exports toExpress function", () => {
    expect(toExpress).toBeTypeOf("function");
  });

  it("accepts RuneApp and Express", () => {
    const app = { fetch: async () => new Response("ok") } as unknown as RuneApp;
    const expressMock = { all: () => expressMock } as any;
    const result = toExpress(app, expressMock);
    expect(result).toBe(expressMock);
  });

  it("handles GET request through express", async () => {
    const app = {
      fetch: async () =>
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
    } as unknown as RuneApp;

    let handler: Function;
    const expressMock = {
      all: (_path: string, h: Function) => {
        handler = h;
        return expressMock;
      },
    } as any;

    toExpress(app, expressMock);

    const status = mock(() => {});
    const setHeader = mock(() => {});
    const send = mock(() => {});
    const req = {
      protocol: "http",
      get: () => "localhost",
      originalUrl: "/test",
      method: "GET",
      headers: { host: "localhost" },
    };
    const res = { status, setHeader, send };

    await handler!(req, res, mock());

    expect(status).toHaveBeenCalledWith(200);
    expect(setHeader).toHaveBeenCalledWith("content-type", "application/json");
    expect(send).toHaveBeenCalledWith(JSON.stringify({ ok: true }));
  });

  it("handles POST request with JSON body", async () => {
    const app = {
      fetch: async (req: Request) => new Response(await req.text(), { status: 201 }),
    } as unknown as RuneApp;

    let handler: Function;
    const expressMock = {
      all: (_path: string, h: Function) => {
        handler = h;
        return expressMock;
      },
    } as any;

    toExpress(app, expressMock);

    const status = mock(() => {});
    const setHeader = mock(() => {});
    const send = mock(() => {});
    const req = {
      protocol: "https",
      get: () => "api.example.com",
      originalUrl: "/data",
      method: "POST",
      headers: { "content-type": "application/json" },
      body: { name: "test" },
    };
    const res = { status, setHeader, send };

    await handler!(req, res, mock());

    expect(status).toHaveBeenCalledWith(201);
    expect(send).toHaveBeenCalledWith(JSON.stringify({ name: "test" }));
  });

  it("falls back to localhost when host header missing", async () => {
    const app = {
      fetch: async (req: Request) => new Response(req.url),
    } as unknown as RuneApp;

    let handler: Function;
    const expressMock = {
      all: (_path: string, h: Function) => {
        handler = h;
        return expressMock;
      },
    } as any;

    toExpress(app, expressMock);

    const status = mock(() => {});
    const setHeader = mock(() => {});
    const send = mock(() => {});
    const req = {
      protocol: "http",
      get: () => undefined,
      originalUrl: "/test",
      method: "GET",
      headers: {},
    };
    const res = { status, setHeader, send };

    await handler!(req, res, mock());

    expect(status).toHaveBeenCalledWith(200);
  });
});
