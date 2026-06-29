import type { RuneApp } from "@rune/core";

/**
 * Shape of a Vercel Edge function request object.
 */
export interface VercelRequest {
  /** The HTTP method. */
  method: string;
  /** The request path. */
  path: string;
  /** The request headers. */
  headers: Record<string, string>;
  /** The optional request body string. */
  body?: string;
  /** Query parameters (single or multi-value). */
  query: Record<string, string | string[]>;
}

/**
 * Shape of a Vercel Edge function response object.
 */
export interface VercelResponse {
  /** The HTTP status code. */
  status: number;
  /** Response headers. */
  headers: Record<string, string>;
  /** The response body string. */
  body: string;
}

/**
 * Creates a Vercel Edge function handler that proxies requests through the Rune application.
 * @param app - The Rune application instance.
 * @returns A function compatible with Vercel Edge runtime.
 *
 * @example
 * ```ts
 * import { toVercelEdge } from "@rune/adapter-vercel";
 * import { createApp } from "@rune/core";
 *
 * const app = createApp();
 * export default toVercelEdge(app);
 * ```
 */
export function toVercelEdge(app: RuneApp): (request: Request) => Promise<Response> {
  return async (request: Request): Promise<Response> => {
    return app.fetch(request);
  };
}
