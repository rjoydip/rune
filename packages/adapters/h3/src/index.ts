import type { RuneApp } from "@rune/core";
import { H3, defineEventHandler, getRequestURL } from "h3";

/**
 * Wraps a Rune application as an h3 server instance.
 * All HTTP methods and paths are forwarded to the Rune request pipeline.
 * @param app - The Rune application instance.
 * @returns An h3 app instance ready to be served via `toNodeHandler` or `toWebHandler`.
 *
 * @example
 * ```ts
 * import { toH3 } from "@rune/adapter-h3";
 * import { createApp } from "@rune/core";
 * import { createServer } from "node:http";
 * import { toNodeHandler } from "h3/node";
 *
 * const app = createApp();
 * const h3App = toH3(app);
 * createServer(toNodeHandler(h3App)).listen(3000);
 * ```
 */
export function toH3(app: RuneApp): H3 {
  const h3App = new H3();

  h3App.all(
    "/**",
    defineEventHandler(async (event) => {
      const url = getRequestURL(event).toString();
      const request = new Request(url, {
        method: event.req.method,
        headers: event.req.headers,
        body:
          event.req.method !== "GET" && event.req.method !== "HEAD"
            ? await event.req.arrayBuffer()
            : undefined,
      });
      return app.fetch(request);
    }),
  );

  return h3App;
}
