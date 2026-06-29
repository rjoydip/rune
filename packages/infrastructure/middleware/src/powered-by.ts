import type { Context, Middleware, NextFunction } from "@rune/core";

/**
 * Options for configuring the X-Powered-By header.
 *
 * @param serverName - The value to set in the X-Powered-By header (default "Rune").
 *
 * @example
 * ```ts
 * import { poweredBy } from "@rune/middleware";
 * app.use(poweredBy({ serverName: "MyAPI" }));
 * ```
 */
export type PoweredByOptions = {
  serverName?: string;
};

/**
 * Middleware that sets the X-Powered-By response header.
 *
 * @param options - Options including the server name to advertise.
 * @returns A middleware function that adds the X-Powered-By header.
 *
 * @example
 * ```ts
 * import { poweredBy } from "@rune/middleware";
 * app.use(poweredBy({ serverName: "MyApp" }));
 * ```
 */
export function poweredBy(options: PoweredByOptions = {}): Middleware {
  const serverName = options.serverName ?? "Rune";

  return async (ctx: Context, next: NextFunction): Promise<Response | void> => {
    await next();
    if (ctx.response) {
      ctx.response.headers.set("X-Powered-By", serverName);
    }
  };
}
