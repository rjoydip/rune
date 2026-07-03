import type { DefaultContext, Middleware } from "koa";
import type { RuneApp } from "@rune/core";

/**
 * Creates a Koa-compatible middleware that delegates all requests to the given Rune application.
 * The middleware reads the incoming Koa context, constructs a standard `Request`, and writes
 * the Rune response back to the Koa context.
 * @param app - The Rune application instance.
 * @returns A Koa middleware function.
 *
 * @example
 * ```ts
 * import { toKoaMiddleware } from "@rune/adapter-koa";
 * import { createApp } from "@rune/core";
 * import Koa from "koa";
 *
 * const app = createApp();
 * const koa = new Koa();
 * koa.use(toKoaMiddleware(app));
 * koa.listen(3000);
 * ```
 */
export function toKoaMiddleware(app: RuneApp): Middleware {
  return async (ctx: DefaultContext, _next: () => Promise<unknown>): Promise<void> => {
    const url = `${ctx.protocol}://${ctx.host}${ctx.url}`;

    let body: BodyInit | undefined;
    if (ctx.method !== "GET" && ctx.method !== "HEAD") {
      body =
        typeof ctx.request.body === "string"
          ? ctx.request.body
          : ctx.request.body != null
            ? JSON.stringify(ctx.request.body)
            : undefined;
    }

    const request = new Request(url, {
      method: ctx.method,
      headers: ctx.headers as Record<string, string>,
      body,
    });

    const res = await app.fetch(request);
    ctx.status = res.status;

    res.headers.forEach((value, key) => {
      ctx.set(key, value);
    });

    ctx.body = await res.text();
  };
}
