import { describe, it, expect, mock } from "bun:test";
import { toVercelEdge } from "../src/index";
import type { RuneApp } from "@rune/core";

describe("adapter-vercel", () => {
  it("exports toVercelEdge function", () => {
    expect(toVercelEdge).toBeTypeOf("function");
  });

  it("returns an edge handler function", () => {
    const app = { fetch: async () => new Response("ok") } as unknown as RuneApp;
    const handler = toVercelEdge(app);
    expect(handler).toBeTypeOf("function");
  });

  it("handles request and returns response", async () => {
    const app = {
      fetch: async (req: Request) =>
        new Response(JSON.stringify({ path: req.url }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
    } as unknown as RuneApp;
    const handler = toVercelEdge(app);

    const res = await handler(new Request("http://vercel.app/api"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.path).toBe("http://vercel.app/api");
  });

  it("handles POST request delegation", async () => {
    const app = {
      fetch: mock(async (req: Request) => {
        expect(req.method).toBe("POST");
        expect(await req.text()).toBe(JSON.stringify({ title: "new" }));
        return new Response("created", { status: 201 });
      }),
    } as unknown as RuneApp;
    const handler = toVercelEdge(app);

    const res = await handler(
      new Request("http://vercel.app/create", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title: "new" }),
      }),
    );
    expect(res.status).toBe(201);
    expect(await res.text()).toBe("created");
  });

  it("handles PUT request delegation", async () => {
    const app = {
      fetch: mock(async (req: Request) => {
        expect(req.method).toBe("PUT");
        return new Response(await req.text(), { status: 200 });
      }),
    } as unknown as RuneApp;
    const handler = toVercelEdge(app);

    const res = await handler(
      new Request("http://vercel.app/update", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: 1 }),
      }),
    );
    expect(res.status).toBe(200);
    expect(await res.text()).toBe(JSON.stringify({ id: 1 }));
  });

  it("propagates response status", async () => {
    const app = {
      fetch: async () => new Response(null, { status: 404 }),
    } as unknown as RuneApp;
    const handler = toVercelEdge(app);

    const res = await handler(new Request("http://vercel.app/notfound"));
    expect(res.status).toBe(404);
  });

  it("propagates response headers", async () => {
    const app = {
      fetch: async () =>
        new Response("ok", {
          status: 200,
          headers: { "x-custom": "value", "content-type": "text/plain" },
        }),
    } as unknown as RuneApp;
    const handler = toVercelEdge(app);

    const res = await handler(new Request("http://vercel.app/test"));
    expect(res.headers.get("x-custom")).toBe("value");
    expect(res.headers.get("content-type")).toBe("text/plain");
  });
});
