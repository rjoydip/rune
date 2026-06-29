import { describe, it, expect } from "bun:test";
import { toElysia } from "../src/index";
import type { RuneApp } from "@rune/core";
import { Elysia } from "elysia";

describe("adapter-elysia", () => {
  it("exports toElysia function", () => {
    expect(toElysia).toBeTypeOf("function");
  });

  it("converts RuneApp to Elysia app", () => {
    const app = { fetch: async () => new Response("ok") } as unknown as RuneApp;
    const elysia = toElysia(app);
    expect(elysia).toBeDefined();
    expect(elysia).toBeInstanceOf(Elysia);
  });

  it("handles GET request through elysia", async () => {
    const app = {
      fetch: async () =>
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
    } as unknown as RuneApp;
    const elysia = toElysia(app);

    const res = await elysia.handle(new Request("http://localhost/test"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });

  it("handles POST request with body", async () => {
    const app = {
      fetch: async (req: Request) => new Response(await req.text(), { status: 201 }),
    } as unknown as RuneApp;
    const elysia = toElysia(app);

    const res = await elysia.handle(
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
    const elysia = toElysia(app);

    const res = await elysia.handle(
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
    const elysia = toElysia(app);

    const res = await elysia.handle(new Request("http://localhost/resource", { method: "DELETE" }));
    expect(res.status).toBe(204);
    expect(await res.text()).toBe("");
  });

  it("delegates request URL and method to the app", async () => {
    const app = {
      fetch: async (req: Request) => new Response(`${req.method}:${req.url}`),
    } as unknown as RuneApp;
    const elysia = toElysia(app);

    const res = await elysia.handle(new Request("http://localhost/hello", { method: "POST" }));
    const text = await res.text();
    expect(text).toContain("POST");
    expect(text).toContain("/hello");
  });
});
