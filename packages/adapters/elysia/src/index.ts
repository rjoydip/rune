import { Elysia } from "elysia";
import type { RuneApp } from "@rune/core";

/**
 * Wraps a Rune application as an Elysia server instance.
 * All HTTP methods and paths are forwarded to the Rune app.
 * @param app - The Rune application instance.
 * @returns An Elysia instance ready to be listened on.
 *
 * @example
 * ```ts
 * import { toElysia } from "@rune/adapter-elysia";
 * import { createApp } from "@rune/core";
 *
 * const app = createApp();
 * const elysia = toElysia(app);
 * elysia.listen(3000);
 * ```
 */
export function toElysia(app: RuneApp): Elysia {
  const elysia = new Elysia();

  elysia.all("*", async ({ request }) => {
    return app.fetch(request);
  });

  return elysia;
}
