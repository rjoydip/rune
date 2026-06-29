import { Hono } from "hono";
import type { RuneApp } from "@rune/core";

/**
 * Wraps a Rune application as a Hono server instance.
 * All HTTP methods and paths are forwarded to the Rune request pipeline.
 * @param app - The Rune application instance.
 * @returns A Hono instance ready to be served.
 *
 * @example
 * ```ts
 * import { toHono } from "@rune/adapter-hono";
 * import { createApp } from "@rune/core";
 *
 * const app = createApp();
 * const hono = toHono(app);
 * Bun.serve({ fetch: hono.fetch, port: 3000 });
 * ```
 */
export function toHono(app: RuneApp): Hono {
  const hono = new Hono();

  hono.all("*", async (c) => {
    const req = new Request(c.req.url, {
      method: c.req.method,
      headers: c.req.raw.headers,
      body:
        c.req.method !== "GET" && c.req.method !== "HEAD"
          ? await c.req.raw.arrayBuffer()
          : undefined,
    });

    const res = await app.fetch(req);
    return new Response(res.body, {
      status: res.status,
      headers: res.headers,
    });
  });

  return hono;
}
