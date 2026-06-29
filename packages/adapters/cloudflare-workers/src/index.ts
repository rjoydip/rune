import type { RuneApp } from "@rune/core";
import type { ExecutionContext } from "@cloudflare/workers-types";

/**
 * Environment bindings provided to a Cloudflare Worker.
 */
export interface CloudflareWorkerEnv {
  /** Arbitrary environment variables and bindings. */
  [key: string]: unknown;
}

/**
 * A Cloudflare Worker fetch handler signature.
 */
export type CloudflareWorkerHandler = (
  request: Request,
  env: CloudflareWorkerEnv,
  ctx: ExecutionContext,
) => Response | Promise<Response>;

/**
 * @deprecated Use `CloudflareWorkerHandler` instead.
 */
export type WorkerHandler = CloudflareWorkerHandler;
/**
 * @deprecated Use `CloudflareWorkerEnv` instead.
 */
export type WorkerEnv = CloudflareWorkerEnv;

/**
 * Creates a Cloudflare Worker fetch handler that delegates requests to the given Rune application.
 * @param app - The Rune application instance.
 * @returns A handler function compatible with Cloudflare Workers.
 *
 * @example
 * ```ts
 * import { toCloudflareWorker } from "@rune/adapter-cloudflare-workers";
 * import { createApp } from "@rune/core";
 *
 * const app = createApp();
 * export default { fetch: toCloudflareWorker(app) };
 * ```
 */
export function toCloudflareWorker(app: RuneApp): CloudflareWorkerHandler {
  return async (
    request: Request,
    _env: CloudflareWorkerEnv,
    _ctx: ExecutionContext,
  ): Promise<Response> => {
    return app.fetch(request);
  };
}

/** @deprecated Use `toCloudflareWorker` instead */
export const toWorker = toCloudflareWorker;
