import { describe, it, expect } from "bun:test";
import { serveDeno } from "../src/index";
import type { RuneApp } from "@rune/core";

let capturedHandler: ((request: Request) => Response | Promise<Response>) | null = null;

// @ts-ignore - Deno is not defined in Bun test environment
globalThis.Deno = {
  serve: (options: {
    port: number;
    hostname: string;
    signal?: AbortSignal;
    handler: (request: Request) => Response | Promise<Response>;
    onError?: (error: unknown) => Response | Promise<Response>;
  }) => {
    capturedHandler = options.handler;
    return {
      finished: Promise.resolve(),
      ref: () => {},
      unref: () => {},
    };
  },
};

describe("adapter-deno", () => {
  it("exports serveDeno function", () => {
    expect(serveDeno).toBeTypeOf("function");
  });

  it("accepts a rune app with options", () => {
    const app = { fetch: async () => new Response("ok") } as unknown as RuneApp;
    serveDeno(app, { port: 4000 });
    expect(capturedHandler).not.toBeNull();
  });

  it("returns server object with expected methods", () => {
    const app = { fetch: async () => new Response("ok") } as unknown as RuneApp;
    const server = serveDeno(app);
    expect(server).toHaveProperty("finished");
    expect(server).toHaveProperty("ref");
    expect(server).toHaveProperty("unref");
  });

  it("calls ref and unref on server", () => {
    const app = { fetch: async () => new Response("ok") } as unknown as RuneApp;
    const server = serveDeno(app);
    expect(() => server.ref()).not.toThrow();
    expect(() => server.unref()).not.toThrow();
  });

  it("accepts custom port option", () => {
    const app = { fetch: async () => new Response("ok") } as unknown as RuneApp;
    serveDeno(app, { port: 8080 });
    expect(capturedHandler).not.toBeNull();
  });

  it("accepts custom hostname option", () => {
    const app = { fetch: async () => new Response("ok") } as unknown as RuneApp;
    serveDeno(app, { hostname: "127.0.0.1" });
    expect(capturedHandler).not.toBeNull();
  });

  it("calls onError handler when app.fetch throws", async () => {
    const app = {
      fetch: async () => {
        throw new Error("boom");
      },
    } as unknown as RuneApp;
    const onError = (_error: unknown) =>
      new Response(JSON.stringify({ error: "handled" }), { status: 500 });
    serveDeno(app, { onError });

    const response = await capturedHandler!(new Request("http://localhost/"));
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toBe("handled");
  });

  it("returns error response when app.fetch throws and no onError provided", async () => {
    const app = {
      fetch: async () => {
        throw new Error("test error");
      },
    } as unknown as RuneApp;
    serveDeno(app);

    const response = await capturedHandler!(new Request("http://localhost/"));
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toBe("test error");
  });

  it("returns successful response when app.fetch succeeds", async () => {
    const app = {
      fetch: async () =>
        new Response(JSON.stringify({ ok: true }), {
          headers: { "content-type": "application/json" },
        }),
    } as unknown as RuneApp;
    serveDeno(app);

    const response = await capturedHandler!(new Request("http://localhost/"));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.ok).toBe(true);
  });
});
