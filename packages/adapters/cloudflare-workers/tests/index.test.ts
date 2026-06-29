import { describe, it, expect, mock } from "bun:test";
import { toCloudflareWorker, toWorker } from "../src/index";
import type { RuneApp } from "@rune/core";

describe("adapter-cloudflare-workers", () => {
  it("exports toCloudflareWorker function", () => {
    expect(toCloudflareWorker).toBeTypeOf("function");
  });

  it("exports toWorker as alias", () => {
    expect(toWorker).toBe(toCloudflareWorker);
  });

  it("returns a worker handler function", () => {
    const app = { fetch: async () => new Response("ok") } as unknown as RuneApp;
    const handler = toCloudflareWorker(app);
    expect(handler).toBeTypeOf("function");
    expect(handler.length).toBe(3);
  });

  it("handles request and returns response", async () => {
    const app = {
      fetch: async (req: Request) =>
        new Response(req.url, {
          status: 200,
          headers: { "x-origin": "worker" },
        }),
    } as unknown as RuneApp;
    const handler = toCloudflareWorker(app);

    const request = new Request("http://example.com/hello");
    const res = await handler(request, {} as any, {} as any);

    expect(res.status).toBe(200);
    expect(res.headers.get("x-origin")).toBe("worker");
    expect(await res.text()).toBe("http://example.com/hello");
  });

  it("handles POST request with body", async () => {
    const app = {
      fetch: mock(async (req: Request) => {
        expect(req.method).toBe("POST");
        return new Response(await req.text(), { status: 201 });
      }),
    } as unknown as RuneApp;
    const handler = toCloudflareWorker(app);

    const res = await handler(
      new Request("http://example.com/create", {
        method: "POST",
        body: JSON.stringify({ title: "new" }),
        headers: { "content-type": "application/json" },
      }),
      {} as any,
      {} as any,
    );
    expect(res.status).toBe(201);
    expect(await res.text()).toBe(JSON.stringify({ title: "new" }));
  });

  it("delegates request URL to the app", async () => {
    const app = {
      fetch: async (req: Request) => new Response(req.url),
    } as unknown as RuneApp;
    const handler = toCloudflareWorker(app);

    const res = await handler(new Request("http://example.com/hello"), {} as any, {} as any);
    expect(await res.text()).toBe("http://example.com/hello");
  });
});
