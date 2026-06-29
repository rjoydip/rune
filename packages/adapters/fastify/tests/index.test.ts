import { describe, it, expect, mock } from "bun:test";
import { toFastify } from "../src/index";
import type { RuneApp } from "@rune/core";

describe("adapter-fastify", () => {
  it("exports toFastify function", () => {
    expect(toFastify).toBeTypeOf("function");
  });

  it("accepts RuneApp and Fastify", () => {
    const app = { fetch: async () => new Response("ok") } as unknown as RuneApp;
    const fastifyMock = { all: () => fastifyMock, listen: () => {} } as any;
    const result = toFastify(app, fastifyMock);
    expect(result).toBe(fastifyMock);
  });

  it("handles GET request through fastify", async () => {
    const app = {
      fetch: async () =>
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "x-custom": "val" },
        }),
    } as unknown as RuneApp;

    let handler: Function;
    const fastifyMock = {
      all: (_path: string, h: Function) => {
        handler = h;
        return fastifyMock;
      },
    } as any;

    toFastify(app, fastifyMock);

    const status = mock(() => {});
    const header = mock(() => {});
    const send = mock(() => "sent");
    const reply = { status, header, send };
    const req = {
      protocol: "http",
      hostname: "localhost",
      url: "/test",
      method: "GET",
      headers: { host: "localhost" },
    };

    await handler!(req, reply);

    expect(status).toHaveBeenCalledWith(200);
    expect(header).toHaveBeenCalledWith("x-custom", "val");
    expect(send).toHaveBeenCalledWith(JSON.stringify({ ok: true }));
  });

  it("handles POST request with JSON body", async () => {
    const app = {
      fetch: async (req: Request) => new Response(await req.text(), { status: 201 }),
    } as unknown as RuneApp;

    let handler: Function;
    const fastifyMock = {
      all: (_path: string, h: Function) => {
        handler = h;
        return fastifyMock;
      },
    } as any;

    toFastify(app, fastifyMock);

    const status = mock(() => {});
    const header = mock(() => {});
    const send = mock(() => "sent");
    const reply = { status, header, send };
    const req = {
      protocol: "https",
      hostname: "api.test",
      url: "/create",
      method: "POST",
      headers: { "content-type": "application/json" },
      body: { title: "new" },
    };

    await handler!(req, reply);

    expect(status).toHaveBeenCalledWith(201);
    expect(send).toHaveBeenCalledWith(JSON.stringify({ title: "new" }));
  });

  it("handles PUT request with body", async () => {
    const app = {
      fetch: async (req: Request) => new Response(await req.text(), { status: 200 }),
    } as unknown as RuneApp;

    let handler: Function;
    const fastifyMock = {
      all: (_path: string, h: Function) => {
        handler = h;
        return fastifyMock;
      },
    } as any;

    toFastify(app, fastifyMock);

    const status = mock(() => {});
    const header = mock(() => {});
    const send = mock(() => "sent");
    const reply = { status, header, send };
    const req = {
      protocol: "http",
      hostname: "localhost",
      url: "/update",
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: { id: 1 },
    };

    await handler!(req, reply);

    expect(status).toHaveBeenCalledWith(200);
    expect(send).toHaveBeenCalledWith(JSON.stringify({ id: 1 }));
  });

  it("handles DELETE request", async () => {
    const app = {
      fetch: async (req: Request) => {
        expect(req.method).toBe("DELETE");
        return new Response(null, { status: 204 });
      },
    } as unknown as RuneApp;

    let handler: Function;
    const fastifyMock = {
      all: (_path: string, h: Function) => {
        handler = h;
        return fastifyMock;
      },
    } as any;

    toFastify(app, fastifyMock);

    const status = mock(() => {});
    const header = mock(() => {});
    const send = mock(() => "sent");
    const reply = { status, header, send };
    const req = {
      protocol: "http",
      hostname: "localhost",
      url: "/resource",
      method: "DELETE",
      headers: {},
      body: null,
    };

    await handler!(req, reply);

    expect(status).toHaveBeenCalledWith(204);
    expect(send).toHaveBeenCalledWith("");
  });

  it("constructs URL from request properties", async () => {
    const app = {
      fetch: async (req: Request) => new Response(req.url),
    } as unknown as RuneApp;

    let handler: Function;
    const fastifyMock = {
      all: (_path: string, h: Function) => {
        handler = h;
        return fastifyMock;
      },
    } as any;

    toFastify(app, fastifyMock);

    const status = mock(() => {});
    const header = mock(() => {});
    const send = mock(() => "sent");
    const reply = { status, header, send };
    const req = {
      protocol: "https",
      hostname: "myapi.com",
      url: "/route",
      method: "GET",
      headers: {},
      body: null,
    };

    await handler!(req, reply);

    expect(status).toHaveBeenCalledWith(200);
    expect(send).toHaveBeenCalledWith("https://myapi.com/route");
  });
});
