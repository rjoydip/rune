import type { Context, Middleware, NextFunction } from "@rune/core";

/**
 * Options for configuring pretty-printed JSON responses.
 *
 * @param space - Number of spaces to use for indentation (default 2).
 * @param queryParam - Query parameter name that triggers pretty-printing (default "pretty").
 *
 * @example
 * ```ts
 * import { prettyJson } from "@rune/middleware";
 * app.use(prettyJson({ space: 4, queryParam: "format" }));
 * ```
 */
export type PrettyJsonOptions = {
  space?: number;
  queryParam?: string;
};

/**
 * Middleware that pretty-prints JSON responses when the request includes a
 * specific query parameter (default "?pretty").
 *
 * @param options - Pretty-print configuration (spaces, query parameter name).
 * @returns A middleware function that reformats JSON bodies for readability.
 *
 * @example
 * ```ts
 * import { prettyJson } from "@rune/middleware";
 * app.use(prettyJson({ space: 2 }));
 * // GET /users?pretty -> JSON body is indented
 * ```
 */
export function prettyJson(options: PrettyJsonOptions = {}): Middleware {
  const space = options.space ?? 2;
  const queryParam = options.queryParam ?? "pretty";

  return async (ctx: Context, next: NextFunction): Promise<Response | void> => {
    await next();

    if (!ctx.response) return;

    const contentType = ctx.response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) return;

    const url = new URL(ctx.request.url);
    if (!url.searchParams.has(queryParam)) return;

    const body = await ctx.response.text();
    try {
      const parsed = JSON.parse(body);
      const pretty = JSON.stringify(parsed, null, space);
      ctx.response = new Response(pretty, {
        status: ctx.response.status,
        statusText: ctx.response.statusText,
        headers: ctx.response.headers,
      });
      ctx.response.headers.set("content-type", "application/json");
    } catch {
      // If body isn't valid JSON, leave as-is
    }
  };
}
