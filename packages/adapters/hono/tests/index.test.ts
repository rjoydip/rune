import { describe, it, expect } from "bun:test";
import { toHono } from "../src/index";
import type { RuneApp } from "@rune/core";
import { Hono } from "hono";

describe("adapter-hono", () => {
  it("exports toHono function", () => {
    expect(toHono).toBeTypeOf("function");
  });

  it("converts RuneApp to Hono app", () => {
    const app = { fetch: async () => new Response("ok") } as unknown as RuneApp;
    const hono = toHono(app);
    expect(hono).toBeDefined();
    expect(hono).toBeInstanceOf(Hono);
  });

  it("handles GET request through hono", async () => {
    const app = {
      fetch: async () =>
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
    } as unknown as RuneApp;
    const hono = toHono(app);

    const res = await hono.fetch(new Request("http://localhost/test"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });

  it("handles POST request with body", async () => {
    const app = {
      fetch: async (req: Request) => new Response(await req.text(), { status: 201 }),
    } as unknown as RuneApp;
    const hono = toHono(app);

    const res = await hono.fetch(
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
    const hono = toHono(app);

    const res = await hono.fetch(
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
    const hono = toHono(app);

    const res = await hono.fetch(new Request("http://localhost/resource", { method: "DELETE" }));
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
    const hono = toHono(app);

    const res = await hono.fetch(new Request("http://localhost/head", { method: "HEAD" }));
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
    const hono = toHono(app);

    const res = await hono.fetch(new Request("http://localhost/missing"));
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body).toEqual({ error: "not found" });
  });
});
