import type { RuneApp } from "@rune/core";

/**
 * Context object provided to Cloudflare Pages Functions.
 *
 * @see https://developers.cloudflare.com/pages/functions/api-reference/#eventcontext
 */
export interface PagesContext {
  request: Request;
  env: Record<string, unknown>;
  params: Record<string, string | undefined>;
  data: Record<string, unknown>;
  next: (request?: Request) => Promise<Response>;
  waitUntil?: (promise: Promise<unknown>) => void;
  passthrough?: (response: Response) => void;
}

/**
 * A Cloudflare Pages Function handler.
 *
 * @see https://developers.cloudflare.com/pages/functions/api-reference/#functions
 */
export type PagesFunction = (context: PagesContext) => Response | Promise<Response>;

/**
 * Creates a Cloudflare Pages Function handler that delegates requests to the given Rune application.
 *
 * The function accepts a `PagesContext` and calls `app.fetch(context.request)`,
 * returning the result as a standard `Response`.
 *
 * @param app - The Rune application instance.
 * @returns A Cloudflare Pages Function handler.
 *
 * @example
 * ```ts
 * import { toCloudflarePagesFunction } from "@rune/adapter-cloudflare-pages";
 * import { createApp } from "@rune/core";
 *
 * const app = createApp();
 * export const onRequest = toCloudflarePagesFunction(app);
 * ```
 */
export function toCloudflarePagesFunction(app: RuneApp): PagesFunction {
  return (context: PagesContext): Promise<Response> => {
    return app.fetch(context.request);
  };
}
