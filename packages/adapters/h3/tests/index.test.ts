import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { toH3 } from "../src/index";
import type { RuneApp } from "@rune/core";
import { toWebHandler } from "h3";
import { toNodeHandler } from "h3/node";
import { createServer } from "node:http";

describe("adapter-h3", () => {
  it("exports toH3 function", () => {
    expect(toH3).toBeTypeOf("function");
  });

  it("converts RuneApp to h3 app", () => {
    const app = { fetch: async () => new Response("ok") } as unknown as RuneApp;
    const h3 = toH3(app);
    expect(h3).toBeDefined();
  });

  it("handles GET request through h3", async () => {
    const app = {
      fetch: async () =>
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
    } as unknown as RuneApp;
    const h3 = toH3(app);
    const handler = toWebHandler(h3);

    const res = await handler(new Request("http://localhost/test"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });

  it("handles POST request with body", async () => {
    const app = {
      fetch: async (req: Request) => new Response(await req.text(), { status: 201 }),
    } as unknown as RuneApp;
    const h3 = toH3(app);
    const handler = toWebHandler(h3);

    const res = await handler(
      new Request("http://localhost/create", {
        method: "POST",
        body: JSON.stringify({ title: "new" }),
        headers: { "content-type": "application/json" },
      }),
    );
    expect(res.status).toBe(201);
    expect(await res.text()).toBe(JSON.stringify({ title: "new" }));
  });

  it("handles PUT request with body", async () => {
    const app = {
      fetch: async (req: Request) => new Response(await req.text(), { status: 200 }),
    } as unknown as RuneApp;
    const h3 = toH3(app);
    const handler = toWebHandler(h3);

    const res = await handler(
      new Request("http://localhost/update", {
        method: "PUT",
        body: JSON.stringify({ id: 1 }),
        headers: { "content-type": "application/json" },
      }),
    );
    expect(res.status).toBe(200);
    expect(await res.text()).toBe(JSON.stringify({ id: 1 }));
  });

  it("handles DELETE request", async () => {
    const app = {
      fetch: async (req: Request) => {
        expect(req.method).toBe("DELETE");
        return new Response(null, { status: 204 });
      },
    } as unknown as RuneApp;
    const h3 = toH3(app);
    const handler = toWebHandler(h3);

    const res = await handler(new Request("http://localhost/resource", { method: "DELETE" }));
    expect(res.status).toBe(204);
    expect(await res.text()).toBe("");
  });

  it("handles HEAD request without body", async () => {
    const app = {
      fetch: async (req: Request) => {
        expect(req.method).toBe("HEAD");
        return new Response(null, { status: 200 });
      },
    } as unknown as RuneApp;
    const h3 = toH3(app);
    const handler = toWebHandler(h3);

    const res = await handler(new Request("http://localhost/head", { method: "HEAD" }));
    expect(res.status).toBe(200);
    expect(await res.text()).toBe("");
  });

  it("propagates error response", async () => {
    const app = {
      fetch: async () =>
        new Response(JSON.stringify({ error: "not found" }), {
          status: 404,
          headers: { "content-type": "application/json" },
        }),
    } as unknown as RuneApp;
    const h3 = toH3(app);
    const handler = toWebHandler(h3);

    const res = await handler(new Request("http://localhost/missing"));
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body).toEqual({ error: "not found" });
  });

  it("delegates request URL and method to the app", async () => {
    const app = {
      fetch: async (req: Request) => new Response(`${req.method}:${req.url}`),
    } as unknown as RuneApp;
    const h3 = toH3(app);
    const handler = toWebHandler(h3);

    const res = await handler(new Request("http://localhost/hello", { method: "POST" }));
    const text = await res.text();
    expect(text).toContain("POST");
    expect(text).toContain("/hello");
  });
});

describe("adapter-h3 node handler", () => {
  let server: ReturnType<typeof createServer>;
  let baseUrl: string;

  beforeAll(async () => {
    const app = {
      fetch: async () =>
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
    } as unknown as RuneApp;

    const h3 = toH3(app);
    server = createServer(toNodeHandler(h3));
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const addr = server.address();
    if (addr && typeof addr === "object") {
      baseUrl = `http://localhost:${addr.port}`;
    }
  });

  afterAll(() => server?.close());

  it("handles GET request through Node.js handler", async () => {
    const res = await fetch(baseUrl + "/test");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });

  it("handles POST request with body through Node.js handler", async () => {
    const app = {
      fetch: async (req: Request) => new Response(await req.text(), { status: 201 }),
    } as unknown as RuneApp;

    const h3 = toH3(app);
    const srv = createServer(toNodeHandler(h3));
    await new Promise<void>((resolve) => srv.listen(0, resolve));
    const addr = srv.address();
    const url =
      addr && typeof addr === "object" ? `http://localhost:${addr.port}` : "http://localhost:0";

    try {
      const res = await fetch(url + "/create", {
        method: "POST",
        body: JSON.stringify({ title: "new" }),
        headers: { "content-type": "application/json" },
      });
      expect(res.status).toBe(201);
      expect(await res.text()).toBe(JSON.stringify({ title: "new" }));
    } finally {
      srv.close();
    }
  });
});
