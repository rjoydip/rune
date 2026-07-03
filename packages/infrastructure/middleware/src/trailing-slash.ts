import type { Context, Middleware, NextFunction } from "@rune/core";

export type TrimTrailingSlashOptions = {
  alwaysRedirect?: boolean;
};

export type AppendTrailingSlashOptions = {
  alwaysRedirect?: boolean;
  skip?: (path: string) => boolean;
};

function createUrlParts(ctx: Context): { url: URL; pathname: string } {
  const url = new URL(ctx.request.url);
  return { url, pathname: url.pathname };
}

function isGetOrHead(ctx: Context): boolean {
  return ctx.request.method === "GET" || ctx.request.method === "HEAD";
}

export function trimTrailingSlash(options: TrimTrailingSlashOptions = {}): Middleware {
  return async (ctx: Context, next: NextFunction): Promise<Response | void> => {
    const { url, pathname } = createUrlParts(ctx);

    if (options.alwaysRedirect) {
      if (isGetOrHead(ctx) && pathname !== "/" && pathname.endsWith("/")) {
        url.pathname = pathname.slice(0, -1);
        return Response.redirect(url.toString(), 301);
      }
    }

    await next();

    if (
      !options.alwaysRedirect &&
      ctx.response?.status === 404 &&
      isGetOrHead(ctx) &&
      pathname !== "/" &&
      pathname.endsWith("/")
    ) {
      url.pathname = pathname.slice(0, -1);
      ctx.response = Response.redirect(url.toString(), 301);
    }
  };
}

export function appendTrailingSlash(options: AppendTrailingSlashOptions = {}): Middleware {
  return async (ctx: Context, next: NextFunction): Promise<Response | void> => {
    const { url, pathname } = createUrlParts(ctx);

    if (options.alwaysRedirect) {
      if (isGetOrHead(ctx) && !pathname.endsWith("/") && !options.skip?.(pathname)) {
        url.pathname = `${pathname}/`;
        return Response.redirect(url.toString(), 301);
      }
    }

    await next();

    if (
      !options.alwaysRedirect &&
      ctx.response?.status === 404 &&
      isGetOrHead(ctx) &&
      !pathname.endsWith("/") &&
      !options.skip?.(pathname)
    ) {
      url.pathname = `${pathname}/`;
      ctx.response = Response.redirect(url.toString(), 301);
    }
  };
}
