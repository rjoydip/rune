import type { Context, Middleware, NextFunction } from "@rune/core";

/**
 * Options for configuring trailing slash removal.
 *
 * @param alwaysRedirect - If true, always redirect (301) to the URL without a trailing slash. If false, only redirect on 404 (default false).
 *
 * @example
 * ```ts
 * import { trimTrailingSlash } from "@rune/middleware";
 * app.use(trimTrailingSlash({ alwaysRedirect: true }));
 * ```
 */
export type TrimTrailingSlashOptions = {
  alwaysRedirect?: boolean;
};

/**
 * Options for configuring trailing slash appending.
 *
 * @param alwaysRedirect - If true, always redirect (301) to the URL with a trailing slash. If false, only redirect on 404 (default false).
 * @param skip - Optional function that returns true to skip appending for specific paths.
 *
 * @example
 * ```ts
 * import { appendTrailingSlash } from "@rune/middleware";
 * app.use(appendTrailingSlash({
 *   alwaysRedirect: true,
 *   skip: (path) => path.endsWith(".json"),
 * }));
 * ```
 */
export type AppendTrailingSlashOptions = {
  alwaysRedirect?: boolean;
  skip?: (path: string) => boolean;
};

/**
 * Middleware that removes trailing slashes from URLs.
 * When `alwaysRedirect` is true, all GET/HEAD requests with trailing slashes
 * receive a 301 redirect. Otherwise, only 404 responses are redirected.
 *
 * @param options - Configuration for trailing slash trimming.
 * @returns A middleware function that removes trailing slashes.
 *
 * @example
 * ```ts
 * import { trimTrailingSlash } from "@rune/middleware";
 * app.use(trimTrailingSlash({ alwaysRedirect: true }));
 * // /users/ -> 301 redirect to /users
 * ```
 */
export function trimTrailingSlash(options: TrimTrailingSlashOptions = {}): Middleware {
  return async (ctx: Context, next: NextFunction): Promise<Response | void> => {
    const url = new URL(ctx.request.url);
    const { pathname } = url;

    if (options.alwaysRedirect) {
      if (
        (ctx.request.method === "GET" || ctx.request.method === "HEAD") &&
        pathname !== "/" &&
        pathname.endsWith("/")
      ) {
        url.pathname = pathname.slice(0, -1);
        return Response.redirect(url.toString(), 301);
      }
    }

    await next();

    if (
      !options.alwaysRedirect &&
      ctx.response?.status === 404 &&
      (ctx.request.method === "GET" || ctx.request.method === "HEAD") &&
      pathname !== "/" &&
      pathname.endsWith("/")
    ) {
      url.pathname = pathname.slice(0, -1);
      ctx.response = Response.redirect(url.toString(), 301);
    }
  };
}

/**
 * Middleware that appends trailing slashes to URLs.
 * When `alwaysRedirect` is true, all GET/HEAD requests without trailing slashes
 * receive a 301 redirect (unless skipped). Otherwise, only 404 responses are redirected.
 *
 * @param options - Configuration for trailing slash appending.
 * @returns A middleware function that appends trailing slashes.
 *
 * @example
 * ```ts
 * import { appendTrailingSlash } from "@rune/middleware";
 * app.use(appendTrailingSlash({ alwaysRedirect: true }));
 * // /users -> 301 redirect to /users/
 * ```
 */
export function appendTrailingSlash(options: AppendTrailingSlashOptions = {}): Middleware {
  return async (ctx: Context, next: NextFunction): Promise<Response | void> => {
    const url = new URL(ctx.request.url);
    const { pathname } = url;

    if (options.alwaysRedirect) {
      if (
        (ctx.request.method === "GET" || ctx.request.method === "HEAD") &&
        !pathname.endsWith("/") &&
        !options.skip?.(pathname)
      ) {
        url.pathname = `${pathname}/`;
        return Response.redirect(url.toString(), 301);
      }
    }

    await next();

    if (
      !options.alwaysRedirect &&
      ctx.response?.status === 404 &&
      (ctx.request.method === "GET" || ctx.request.method === "HEAD") &&
      !pathname.endsWith("/") &&
      !options.skip?.(pathname)
    ) {
      url.pathname = `${pathname}/`;
      ctx.response = Response.redirect(url.toString(), 301);
    }
  };
}
