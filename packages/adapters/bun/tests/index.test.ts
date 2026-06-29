import { describe, it, expect, mock } from "bun:test";
import { serveBun } from "../src/index";
import type { RuneApp } from "@rune/core";

describe("adapter-bun", () => {
  it("exports serveBun function", () => {
    expect(serveBun).toBeTypeOf("function");
  });

  it("accepts a rune app and port", () => {
    const app = { fetch: async () => new Response("ok") } as unknown as RuneApp;
    const port = Math.floor(Math.random() * 10000) + 3000;
    expect(() => serveBun(app, port)).not.toThrow();
  });

  it("handler delegates request URL to the app", async () => {
    let handler: ((req: Request) => Response | Promise<Response>) | undefined;
    const serveMock = mock((opts: any) => {
      handler = opts.fetch;
      return { stop() {} };
    });

    const originalServe = Bun.serve;
    (Bun as any).serve = serveMock;

    const appFetch = mock(async (req: Request) => {
      expect(req.url).toBe("http://localhost/custom-path");
      return new Response("ok");
    });
    const app = { fetch: appFetch } as unknown as RuneApp;

    serveBun(app, 9999);
    expect(serveMock).toHaveBeenCalled();

    await handler!(new Request("http://localhost/custom-path"));
    expect(appFetch).toHaveBeenCalledTimes(1);

    (Bun as any).serve = originalServe;
  });

  it("handler delegates request method to the app", async () => {
    let handler: ((req: Request) => Response | Promise<Response>) | undefined;
    const serveMock = mock((opts: any) => {
      handler = opts.fetch;
      return { stop() {} };
    });

    const originalServe = Bun.serve;
    (Bun as any).serve = serveMock;

    const appFetch = mock(async (req: Request) => {
      expect(req.method).toBe("POST");
      return new Response("ok");
    });
    const app = { fetch: appFetch } as unknown as RuneApp;

    serveBun(app, 9999);
    await handler!(new Request("http://localhost/create", { method: "POST" }));
    expect(appFetch).toHaveBeenCalledTimes(1);

    (Bun as any).serve = originalServe;
  });

  it("serves on the provided port", () => {
    const serveMock = mock((opts: any) => {
      expect(opts.port).toBe(8080);
      return { stop() {} };
    });

    const originalServe = Bun.serve;
    (Bun as any).serve = serveMock;

    const app = { fetch: async () => new Response("ok") } as unknown as RuneApp;
    serveBun(app, 8080);
    expect(serveMock).toHaveBeenCalled();

    (Bun as any).serve = originalServe;
  });
});
