import { describe, it, expect } from "bun:test";
import { createNodeServer, createNodeHttpsServer } from "../src/index";
import type { RuneApp } from "@rune/core";

describe("adapter-node", () => {
  it("exports createNodeServer function", () => {
    expect(createNodeServer).toBeTypeOf("function");
  });

  it("exports createNodeHttpsServer function", () => {
    expect(createNodeHttpsServer).toBeTypeOf("function");
  });

  it("createNodeServer creates an http.Server", () => {
    const app = { fetch: async () => new Response("ok") } as unknown as RuneApp;
    const server = createNodeServer(app);
    expect(server).toBeDefined();
    expect(server.listen).toBeTypeOf("function");
    expect(server.close).toBeTypeOf("function");
    server.close();
  });

  it("createNodeServer handles GET request", async () => {
    const app = {
      fetch: async (req: Request) => {
        expect(req.method).toBe("GET");
        expect(req.url).toContain("/test");
        return new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "x-custom": "val" },
        });
      },
    } as unknown as RuneApp;

    const server = createNodeServer(app);
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const addr = server.address() as { port: number };

    const res = await fetch(`http://localhost:${addr.port}/test`);
    expect(res.status).toBe(200);
    expect(res.headers.get("x-custom")).toBe("val");
    const body = await res.json();
    expect(body).toEqual({ ok: true });

    server.close();
  });

  it("createNodeServer handles POST request with body", async () => {
    const app = {
      fetch: async (req: Request) => {
        const text = await req.text();
        expect(req.method).toBe("POST");
        return new Response(text, { status: 201 });
      },
    } as unknown as RuneApp;

    const server = createNodeServer(app);
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const addr = server.address() as { port: number };

    const res = await fetch(`http://localhost:${addr.port}/data`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ hello: "world" }),
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body).toEqual({ hello: "world" });

    server.close();
  });

  it("createNodeServer handles PUT request with body", async () => {
    const app = {
      fetch: async (req: Request) => {
        const text = await req.text();
        expect(req.method).toBe("PUT");
        return new Response(text, { status: 200 });
      },
    } as unknown as RuneApp;

    const server = createNodeServer(app);
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const addr = server.address() as { port: number };

    const res = await fetch(`http://localhost:${addr.port}/update`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: 1 }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ id: 1 });

    server.close();
  });

  it("createNodeServer handles PATCH request with body", async () => {
    const app = {
      fetch: async (req: Request) => {
        const text = await req.text();
        expect(req.method).toBe("PATCH");
        return new Response(text, { status: 200 });
      },
    } as unknown as RuneApp;

    const server = createNodeServer(app);
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const addr = server.address() as { port: number };

    const res = await fetch(`http://localhost:${addr.port}/patch`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ op: "replace" }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ op: "replace" });

    server.close();
  });

  it("createNodeServer handles DELETE request", async () => {
    const app = {
      fetch: async (req: Request) => {
        expect(req.method).toBe("DELETE");
        return new Response(null, { status: 204 });
      },
    } as unknown as RuneApp;

    const server = createNodeServer(app);
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const addr = server.address() as { port: number };

    const res = await fetch(`http://localhost:${addr.port}/resource`, { method: "DELETE" });
    expect(res.status).toBe(204);
    expect(await res.text()).toBe("");

    server.close();
  });

  it("createNodeServer handles HEAD request without body", async () => {
    const app = {
      fetch: async (req: Request) => {
        expect(req.method).toBe("HEAD");
        return new Response(null, { status: 200, headers: { "content-length": "0" } });
      },
    } as unknown as RuneApp;

    const server = createNodeServer(app);
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const addr = server.address() as { port: number };

    const res = await fetch(`http://localhost:${addr.port}/head`, { method: "HEAD" });
    expect(res.status).toBe(200);
    expect(await res.text()).toBe("");

    server.close();
  });

  it("createNodeServer handles empty response body", async () => {
    const app = {
      fetch: async () => new Response("", { status: 204 }),
    } as unknown as RuneApp;

    const server = createNodeServer(app);
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const addr = server.address() as { port: number };

    const res = await fetch(`http://localhost:${addr.port}/empty`);
    expect(res.status).toBe(204);
    expect(await res.text()).toBe("");

    server.close();
  });

  it("createNodeServer preserves request headers", async () => {
    const app = {
      fetch: async (req: Request) => {
        expect(req.headers.get("authorization")).toBe("Bearer token123");
        expect(req.headers.get("accept")).toBe("application/json");
        return new Response("ok", { status: 200 });
      },
    } as unknown as RuneApp;

    const server = createNodeServer(app);
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const addr = server.address() as { port: number };

    const res = await fetch(`http://localhost:${addr.port}/headers`, {
      headers: {
        authorization: "Bearer token123",
        accept: "application/json",
      },
    });
    expect(res.status).toBe(200);

    server.close();
  });

  it("createNodeHttpsServer creates an https.Server", () => {
    const app = { fetch: async () => new Response("ok") } as unknown as RuneApp;
    const server = createNodeHttpsServer(app);
    expect(server).toBeDefined();
    expect(server.listen).toBeTypeOf("function");
    expect(server.close).toBeTypeOf("function");
    server.close();
  });
});
