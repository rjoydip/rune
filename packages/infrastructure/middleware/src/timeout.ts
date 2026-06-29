import type { Context, Middleware, NextFunction } from "@rune/core";

/**
 * Middleware that aborts requests exceeding the specified duration.
 * Returns a 504 Gateway Timeout response when the timeout is reached.
 *
 * @param duration - Timeout in milliseconds. Requests exceeding this duration are aborted.
 * @param errorResponse - Optional custom Response to return on timeout (default 504 Gateway Timeout).
 * @returns A middleware function that races the request against a timeout.
 *
 * @example
 * ```ts
 * import { timeout } from "@rune/middleware";
 * app.use(timeout(5000));
 * // Requests taking longer than 5 seconds receive 504
 * ```
 *
 * @example
 * ```ts
 * import { timeout } from "@rune/middleware";
 * app.use(timeout(3000, new Response("Request timed out", { status: 408 })));
 * ```
 */
export function timeout(duration: number, errorResponse?: Response): Middleware {
  const timeoutError = errorResponse ?? new Response("Gateway Timeout", { status: 504 });

  return async (_ctx: Context, next: NextFunction): Promise<Response | void> => {
    let timer: ReturnType<typeof setTimeout> | undefined;

    const timeoutPromise = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(timeoutError), duration);
    });

    try {
      return await Promise.race([next(), timeoutPromise]);
    } finally {
      if (timer) clearTimeout(timer);
    }
  };
}
