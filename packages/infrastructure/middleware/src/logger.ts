import type { Context, Middleware, NextFunction } from "@rune/core";

enum LogStatus {
  Incoming = "<--",
  Outgoing = "-->",
}

function colorStatus(status: number): string {
  if (status >= 500) return `\x1b[31m${status}\x1b[0m`;
  if (status >= 400) return `\x1b[33m${status}\x1b[0m`;
  if (status >= 300) return `\x1b[36m${status}\x1b[0m`;
  if (status >= 200) return `\x1b[32m${status}\x1b[0m`;
  return `${status}`;
}

function time(start: number): string {
  const delta = Date.now() - start;
  return delta < 1000 ? `${delta}ms` : `${Math.round(delta / 1000)}s`;
}

/**
 * Function signature for logging output.
 *
 * @example
 * ```ts
 * const logFunc: LogFunc = (str, ...rest) => console.log(str, ...rest);
 * ```
 */
export type LogFunc = (str: string, ...rest: string[]) => void;

/**
 * Log severity levels.
 *
 * @example
 * ```ts
 * const level: LogLevel = "info";
 * ```
 */
export type LogLevel = "info" | "warn" | "error" | "debug";

/**
 * Options for configuring the request logger middleware.
 *
 * @param logFunc - Custom logging function (default console.log).
 * @param level - Minimum log level to output.
 * @param skip - Optional function that returns true to skip logging for a given request.
 *
 * @example
 * ```ts
 * import type { LoggerOptions } from "@rune/middleware";
 * const opts: LoggerOptions = { logFunc: console.warn };
 * ```
 */
export type LoggerOptions = {
  logFunc?: LogFunc;
  level?: LogLevel;
  skip?: (ctx: Context) => boolean;
};

/**
 * Middleware that logs incoming HTTP requests and outgoing responses
 * with method, path, status code, and response time.
 *
 * @param options - Logger configuration (custom log function, level, skip predicate).
 * @returns A middleware function that logs request/response pairs.
 *
 * @example
 * ```ts
 * import { logger } from "@rune/middleware";
 * app.use(logger({ skip: (ctx) => ctx.request.url.includes("/health") }));
 * ```
 */
export function logger(options: LoggerOptions = {}): Middleware {
  const logFunc = options.logFunc ?? console.log;
  const skip = options.skip;

  return async (ctx: Context, next: NextFunction): Promise<Response | void> => {
    if (skip && skip(ctx)) {
      return next();
    }

    const url = new URL(ctx.request.url);
    const path = url.pathname;
    const method = ctx.request.method;

    logFunc(`${LogStatus.Incoming} ${method} ${path}`);

    const start = Date.now();

    await next();

    if (ctx.response) {
      logFunc(
        `${LogStatus.Outgoing} ${method} ${path} ${colorStatus(ctx.response.status)} ${time(start)}`,
      );
    } else {
      logFunc(`${LogStatus.Outgoing} ${method} ${path} ??? ${time(start)}`);
    }
  };
}
