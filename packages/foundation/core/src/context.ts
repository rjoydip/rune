import type { Container } from "@rune/container";

/**
 * Wraps an incoming HTTP Request and provides access to parsed
 * body, query parameters, route params, container, and response helpers.
 *
 * @example
 * ```ts
 * const ctx = new Context(request, { id: "42" }, container);
 * const body = await ctx.body;
 * const query = ctx.query;
 * ```
 */
export class Context {
  readonly request: Request;
  readonly params: Record<string, string>;
  readonly container: Container;
  readonly state: Map<string, unknown>;
  response: Response | null;

  private bodyCache: Promise<unknown> | null = null;
  private queryCache: Record<string, string> | null = null;
  private paramsArrayCache: string[] | null = null;
  private queryValuesCache: string[] | null = null;

  /**
   * @param request - The incoming HTTP request.
   * @param params - URL path parameters extracted by the router.
   * @param container - The dependency injection container.
   */
  constructor(request: Request, params: Record<string, string>, container: Container) {
    this.request = request;
    this.params = params;
    this.container = container;
    this.state = new Map();
    this.response = null;
  }

  /**
   * Lazily parse and cache the request body as JSON.
   *
   * @example
   * ```ts
   * const data = await ctx.body;
   * ```
   */
  get body(): Promise<unknown> {
    if (!this.bodyCache) {
      this.bodyCache = this.request.clone().json();
    }
    return this.bodyCache;
  }

  /**
   * Lazily parse and cache query string parameters.
   *
   * @example
   * ```ts
   * const limit = ctx.query.limit;
   * ```
   */
  get query(): Record<string, string> {
    if (!this.queryCache) {
      const qmark = this.request.url.indexOf("?");
      if (qmark === -1) {
        this.queryCache = {};
      } else {
        const params = new URLSearchParams(this.request.url.slice(qmark));
        this.queryCache = Object.fromEntries(params);
      }
    }
    return this.queryCache;
  }

  /**
   * Cached array of route param values.
   *
   * @example
   * ```ts
   * const vals = ctx.paramsArray;
   * ```
   */
  get paramsArray(): string[] {
    if (!this.paramsArrayCache) {
      this.paramsArrayCache = Object.values(this.params);
    }
    return this.paramsArrayCache;
  }

  /**
   * Cached array of query string values.
   *
   * @example
   * ```ts
   * const vals = ctx.queryValues;
   * ```
   */
  get queryValues(): string[] {
    if (!this.queryValuesCache) {
      this.queryValuesCache = Object.values(this.query);
    }
    return this.queryValuesCache;
  }

  /**
   * Convenience accessor for the request headers.
   *
   * @example
   * ```ts
   * const auth = ctx.headers.get("authorization");
   * ```
   */
  get headers(): Headers {
    return this.request.headers;
  }

  /**
   * Create a JSON response and store it on the context.
   * @param data - The payload to serialize.
   * @param status - HTTP status code (default 200).
   * @returns The created Response.
   *
   * @example
   * ```ts
   * ctx.send({ user: "alice" }, 201);
   * ```
   */
  send(data: unknown, status = 200): Response {
    const body =
      typeof data === "string"
        ? data
        : typeof data === "number" || typeof data === "boolean" || data === null
          ? String(data)
          : JSON.stringify(data);
    this.response = new Response(body, {
      status,
      headers: { "content-type": "application/json" },
    });
    return this.response;
  }

  /**
   * Create a status-only response (no body) and store it on the context.
   * @param status - HTTP status code.
   * @returns The created Response.
   *
   * @example
   * ```ts
   * ctx.sendStatus(204);
   * ```
   */
  sendStatus(status: number): Response {
    this.response = new Response(null, { status });
    return this.response;
  }
}
