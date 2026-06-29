import type { RuneApp } from "@rune/core";

/**
 * Creates a service worker fetch handler that delegates requests to the given Rune application.
 * Compatible with the `FetchEvent` API used in browser service workers.
 *
 * @param app - The Rune application instance.
 * @returns A function that handles `FetchEvent` by calling `event.respondWith()`.
 *
 * @example
 * ```ts
 * import { toServiceWorker } from "@rune/adapter-service-worker";
 * import { createApp } from "@rune/core";
 *
 * const app = createApp();
 * self.addEventListener("fetch", toServiceWorker(app));
 * ```
 */
export function toServiceWorker(app: RuneApp): (event: FetchEvent) => void {
  return (event: FetchEvent): void => {
    event.respondWith(app.fetch(event.request));
  };
}
