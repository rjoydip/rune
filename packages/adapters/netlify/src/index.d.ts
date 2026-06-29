import type { RuneApp } from "@rune/core";
/**
 * Shape of a Netlify Function event object.
 */
export interface NetlifyEvent {
  /** The request path. */
  path: string;
  /** The HTTP method of the request. */
  httpMethod: string;
  /** The request headers. */
  headers: Record<string, string | undefined>;
  /** Query string parameters, or null if none. */
  queryStringParameters: Record<string, string> | null;
  /** The raw request body, or null if no body. */
  body: string | null;
  /** Whether the body is Base64-encoded. */
  isBase64Encoded: boolean;
}
/**
 * Shape of the context object passed to a Netlify Function handler.
 */
export interface NetlifyContext {
  /** Client context populated by Netlify authentication. */
  clientContext?: Record<string, unknown>;
}
/**
 * Shape of the response returned by a Netlify Function handler.
 */
export interface NetlifyResponse {
  /** The HTTP status code. */
  statusCode: number;
  /** Response headers. */
  headers?: Record<string, string>;
  /** The response body as a string. */
  body: string;
  /** Whether the body is Base64-encoded. */
  isBase64Encoded?: boolean;
}
/**
 * Creates a Netlify Edge function handler that proxies requests through the Rune application.
 *
 * Netlify Edge Functions receive a standard `Request` and return a standard `Response`.
 * This adapter passes all requests directly through to `app.fetch()`.
 *
 * @param app - The Rune application instance.
 * @returns A function compatible with Netlify Edge Functions.
 *
 * @example
 * ```ts
 * import { toNetlifyEdge } from "@rune/adapter-netlify";
 * import { createApp } from "@rune/core";
 *
 * const app = createApp();
 * export default toNetlifyEdge(app);
 * ```
 */
export declare function toNetlifyEdge(app: RuneApp): (request: Request) => Promise<Response>;
/**
 * Creates a Netlify Function handler that routes event-style requests through the Rune application.
 *
 * Netlify Functions receive an event object (path, httpMethod, headers, etc.) and return
 * a structured response (statusCode, headers, body). This adapter converts the event into
 * a standard `Request`, delegates to `app.fetch()`, and maps the `Response` back to the
 * Netlify response shape.
 *
 * @param app - The Rune application instance.
 * @returns A Netlify Function handler compatible with Netlify's serverless function API.
 *
 * @example
 * ```ts
 * import { toNetlifyFunction } from "@rune/adapter-netlify";
 * import { createApp } from "@rune/core";
 *
 * const app = createApp();
 * export const handler = toNetlifyFunction(app);
 * ```
 */
export declare function toNetlifyFunction(
  app: RuneApp,
): (event: NetlifyEvent, context: NetlifyContext) => Promise<NetlifyResponse>;
//# sourceMappingURL=index.d.ts.map
