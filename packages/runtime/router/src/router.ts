import { createRouter, addRoute, findRoute } from "rou3";

/**
 * Supported HTTP methods for route registration.
 */
export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "HEAD" | "OPTIONS";

/**
 * Describes a single route to be registered with the router.
 *
 * @example
 * ```ts
 * const route: RouteDefinition = {
 *   method: "GET",
 *   path: "/users/:id",
 *   handler: (req, params) => new Response(params.id),
 * };
 * ```
 */
export interface RouteDefinition {
  method: HttpMethod;
  path: string;
  handler: RouteHandler;
}

/**
 * The result of a successful route match.
 */
export interface RouteMatch {
  handler: RouteHandler;
  params: Record<string, string>;
}

/**
 * A route handler function.
 * @param request - The incoming HTTP request.
 * @param params - URL path parameters extracted by the router.
 * @param context - A shared state map scoped to the request.
 * @returns A Response or a promise resolving to one.
 *
 * @example
 * ```ts
 * const handler: RouteHandler = (req, params, ctx) => {
 *   return new Response(`Hello ${params.id}`);
 * };
 * ```
 */
export type RouteHandler = (
  request: Request,
  params: Record<string, string>,
  context: Map<string, unknown>,
) => Response | Promise<Response>;

const EMPTY_PARAMS: Record<string, string> = {};
const UPPER_METHODS = new Set(["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"]);

/**
 * URL router backed by rou3 that supports static and parameterized routes.
 *
 * @example
 * ```ts
 * const router = new Router();
 * router.add("GET", "/users/:id", handler);
 * const match = router.match("GET", "/users/42");
 * ```
 */
export class Router {
  private readonly ctx = createRouter<RouteHandler>();
  private readonly staticCache = new Map<string, RouteMatch>();

  /**
   * Register a route.
   * @param method - HTTP method.
   * @param path - URL path pattern (e.g. "/users/:id").
   * @param handler - The route handler function.
   *
   * @example
   * ```ts
   * router.add("GET", "/users", listHandler);
   * ```
   */
  add(method: HttpMethod, path: string, handler: RouteHandler): void {
    if (!method || !UPPER_METHODS.has(method.toUpperCase())) {
      throw new Error(`Unsupported HTTP method: ${method}`);
    }
    if (!path.includes(":") && !path.includes("*")) {
      this.staticCache.set(`${method}:${path}`, { handler, params: {} });
    }
    addRoute(this.ctx, method, path, handler);
  }

  /**
   * Match a request method and pathname against registered routes.
   * @param method - HTTP method string.
   * @param pathname - URL pathname (query string should be stripped).
   * @returns A RouteMatch if found, or null.
   *
   * @example
   * ```ts
   * const match = router.match("GET", "/users/42");
   * if (match) return match.handler(request, match.params, new Map());
   * ```
   */
  match(method: string, pathname: string): RouteMatch | null {
    const upper = UPPER_METHODS.has(method) ? method : method.toUpperCase();
    const cached = this.staticCache.get(`${upper}:${pathname}`);
    if (cached) return cached;
    const result = findRoute(this.ctx, upper, pathname, {
      params: true,
    });
    if (!result) return null;
    return {
      handler: result.data,
      params: result.params ?? EMPTY_PARAMS,
    };
  }

  /**
   * Register a route from a RouteDefinition object.
   * @param route - The route definition.
   *
   * @example
   * ```ts
   * router.addRoute({ method: "GET", path: "/health", handler });
   * ```
   */
  addRoute(route: RouteDefinition): void {
    this.add(route.method, route.path, route.handler);
  }

  /**
   * Register multiple routes at once.
   * @param routes - An array of route definitions.
   *
   * @example
   * ```ts
   * router.addRoutes([
   *   { method: "GET", path: "/a", handler: a },
   *   { method: "POST", path: "/b", handler: b },
   * ]);
   * ```
   */
  addRoutes(routes: RouteDefinition[]): void {
    for (const route of routes) {
      this.addRoute(route);
    }
  }
}
