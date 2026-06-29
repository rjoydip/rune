import type { RuneApp } from "@rune/core";

/**
 * Starts a Bun HTTP server that delegates all requests to the given Rune application.
 * @param app - The Rune application instance.
 * @param port - The port to listen on (default 3000).
 *
 * @example
 * ```ts
 * import { serveBun } from "@rune/adapter-bun";
 * import { createApp } from "@rune/core";
 *
 * const app = createApp();
 * serveBun(app, 8080);
 * ```
 */
export function serveBun(app: RuneApp, port = 3000): void {
  Bun.serve({
    port,
    fetch: (request: Request) => app.fetch(request),
  });
}
