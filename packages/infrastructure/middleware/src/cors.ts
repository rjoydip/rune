import type { Context, Middleware, NextFunction } from "@rune/core";

/**
 * Options for configuring CORS behavior.
 *
 * @param origin - Allowed origin(s). Can be a string, string array, or a function that dynamically resolves the origin (default "*").
 * @param allowMethods - HTTP methods allowed for CORS requests (default GET, HEAD, PUT, POST, DELETE, PATCH).
 * @param allowHeaders - HTTP headers allowed in CORS requests.
 * @param credentials - Whether to expose the Access-Control-Allow-Credentials header (default false).
 * @param maxAge - How long (in seconds) the preflight result can be cached.
 * @param exposeHeaders - Headers exposed to the browser via Access-Control-Expose-Headers.
 *
 * @example
 * ```ts
 * import { cors } from "@rune/middleware";
 * app.use(cors({ origin: "https://myapp.com", credentials: true }));
 * ```
 */
export type CORSOptions = {
  origin?:
    | string
    | string[]
    | ((
        origin: string,
        c: Context,
      ) => string | null | undefined | Promise<string | null | undefined>);
  allowMethods?: string[];
  allowHeaders?: string[];
  maxAge?: number;
  credentials?: boolean;
  exposeHeaders?: string[];
};

/**
 * Middleware that adds CORS headers to responses and handles preflight OPTIONS requests.
 * Supports static origins, arrays of origins, and dynamic origin resolution via function.
 *
 * @param options - CORS configuration.
 * @returns A middleware function that sets CORS headers on responses.
 *
 * @example
 * ```ts
 * import { cors } from "@rune/middleware";
 * app.use(cors({ origin: ["https://app1.com", "https://app2.com"] }));
 * ```
 */
export function cors(options: CORSOptions = {}): Middleware {
  const opts = {
    origin: "*",
    allowMethods: ["GET", "HEAD", "PUT", "POST", "DELETE", "PATCH"],
    allowHeaders: [],
    exposeHeaders: [],
    ...options,
  };

  return async (ctx: Context, next: NextFunction): Promise<Response | void> => {
    const reqOrigin = ctx.headers.get("origin") || "";

    let allowOrigin: string | null | undefined;
    if (typeof opts.origin === "string") {
      allowOrigin = opts.origin === "*" ? "*" : opts.origin === reqOrigin ? reqOrigin : null;
    } else if (Array.isArray(opts.origin)) {
      allowOrigin = opts.origin.includes(reqOrigin) ? reqOrigin : null;
    } else {
      allowOrigin = await opts.origin(reqOrigin, ctx);
    }

    if (!allowOrigin) {
      return next();
    }

    if (ctx.request.method === "OPTIONS") {
      const headers = new Headers();
      headers.set("Access-Control-Allow-Origin", allowOrigin);
      if (opts.credentials) headers.set("Access-Control-Allow-Credentials", "true");
      if (opts.exposeHeaders.length)
        headers.set("Access-Control-Expose-Headers", opts.exposeHeaders.join(","));
      if (opts.maxAge != null) headers.set("Access-Control-Max-Age", opts.maxAge.toString());
      headers.set("Access-Control-Allow-Methods", opts.allowMethods.join(","));

      let headersToAllow = opts.allowHeaders;
      if (!headersToAllow.length) {
        const reqHeaders = ctx.headers.get("access-control-request-headers");
        if (reqHeaders) headersToAllow = reqHeaders.split(/\s*,\s*/);
      }
      if (headersToAllow.length) {
        headers.set("Access-Control-Allow-Headers", headersToAllow.join(","));
      }

      return new Response(null, { status: 204, headers });
    }

    await next();

    if (ctx.response) {
      ctx.response.headers.set("Access-Control-Allow-Origin", allowOrigin);
      if (opts.credentials) ctx.response.headers.set("Access-Control-Allow-Credentials", "true");
      if (opts.exposeHeaders.length) {
        ctx.response.headers.set("Access-Control-Expose-Headers", opts.exposeHeaders.join(","));
      }
    }
  };
}
