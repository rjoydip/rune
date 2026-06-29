import type { Context, Middleware, NextFunction } from "@rune/core";

/**
 * Options for configuring request ID generation.
 *
 * @param headerName - The header name to read/assign the request ID (default "X-Request-Id").
 * @param generator - Custom function that returns a unique ID string (default crypto.randomUUID).
 * @param limitLength - Maximum allowed length for an incoming request ID before regeneration (default 255).
 *
 * @example
 * ```ts
 * import { requestId } from "@rune/middleware";
 * app.use(requestId({ headerName: "X-Trace-Id", limitLength: 64 }));
 * ```
 */
export type RequestIdOptions = {
  headerName?: string;
  generator?: () => string;
  limitLength?: number;
};

/**
 * Middleware that assigns a unique ID to each request.
 * Reads an existing ID from the request header or generates a new one,
 * then sets it on the response header and stores it in context state.
 *
 * @param options - Request ID configuration (header name, generator, length limit).
 * @returns A middleware function that attaches request IDs.
 *
 * @example
 * ```ts
 * import { requestId } from "@rune/middleware";
 * app.use(requestId());
 * // Each response includes X-Request-Id header
 * ```
 */
export function requestId(options: RequestIdOptions = {}): Middleware {
  const headerName = options.headerName ?? "X-Request-Id";
  const generator = options.generator ?? (() => crypto.randomUUID());
  const limitLength = options.limitLength ?? 255;

  return async (ctx: Context, next: NextFunction): Promise<Response | void> => {
    let reqId = headerName ? String(ctx.headers.get(headerName.toLowerCase()) || "") : undefined;

    if (!reqId || reqId.length > limitLength || /[^\w\-=]/.test(reqId)) {
      reqId = generator();
    }

    ctx.state.set("requestId", reqId);

    await next();

    if (ctx.response && headerName) {
      ctx.response.headers.set(headerName, reqId);
    }
  };
}
