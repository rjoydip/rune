import { describe, it, expect, mock } from "bun:test";
import { toServiceWorker } from "../src/index";
import type { RuneApp } from "@rune/core";

describe("adapter-service-worker", () => {
  it("exports toServiceWorker function", () => {
    expect(toServiceWorker).toBeTypeOf("function");
  });

  it("returns a function that accepts FetchEvent", () => {
    const app = { fetch: async () => new Response("ok") } as unknown as RuneApp;
    const handler = toServiceWorker(app);
    expect(handler).toBeTypeOf("function");
    expect(handler.length).toBe(1);
  });

  it("calls respondWith with app.fetch result", async () => {
    const app = {
      fetch: async (req: Request) =>
        new Response(JSON.stringify({ url: req.url }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
    } as unknown as RuneApp;
    const handler = toServiceWorker(app);

    let responsePromise: Promise<Response> | undefined;
    const event = {
      request: new Request("http://localhost/hello"),
      respondWith: mock((res: Promise<Response>) => {
        responsePromise = res;
      }),
    } as unknown as FetchEvent;

    handler(event);
    expect(event.respondWith).toHaveBeenCalled();

    const res = await responsePromise!;
    const body = await res.json();
    expect(body.url).toBe("http://localhost/hello");
  });

  it("handles POST request", async () => {
    const app = {
      fetch: mock(async (req: Request) => {
        expect(req.method).toBe("POST");
        return new Response(await req.text(), { status: 201 });
      }),
    } as unknown as RuneApp;
    const handler = toServiceWorker(app);

    const event = {
      request: new Request("http://localhost/data", {
        method: "POST",
        body: JSON.stringify({ value: "test" }),
        headers: { "content-type": "application/json" },
      }),
      respondWith: mock(() => {}),
    } as unknown as FetchEvent;

    handler(event);
    expect(event.respondWith).toHaveBeenCalled();
  });

  it("propagates error status codes", async () => {
    const app = {
      fetch: async () => new Response("Not Found", { status: 404 }),
    } as unknown as RuneApp;
    const handler = toServiceWorker(app);

    let respondedWith: Response | undefined;
    const event = {
      request: new Request("http://localhost/missing"),
      respondWith: mock((res: Response) => {
        respondedWith = res;
      }),
    } as unknown as FetchEvent;

    handler(event);
    const res = await respondedWith!;
    expect(res.status).toBe(404);
  });
});
