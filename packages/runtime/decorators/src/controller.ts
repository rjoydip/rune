import {
  CONTROLLER_PREFIX,
  ROUTE_HANDLERS,
  PARAM_METADATA,
  setMeta,
  getMeta,
  deleteMeta,
} from "./metadata.js";
import type { RouteHandlerMetadata, ParamMetadata } from "./metadata.js";

/**
 * Class decorator that marks a class as a controller and defines its URL prefix.
 * @param prefix - The URL prefix for all routes in this controller (default "/").
 *
 * @example
 * ```ts
 * @Controller("/users")
 * class UserController {
 *   @Get("/:id")
 *   getUser() { return { id: 1 }; }
 * }
 * ```
 */
export function Controller(prefix = "/") {
  return (target: Function, _context: ClassDecoratorContext) => {
    setMeta(target, CONTROLLER_PREFIX, prefix);
    const routes: RouteHandlerMetadata[] = [];
    for (const key of Object.getOwnPropertyNames(target.prototype)) {
      if (key === "constructor") continue;
      const method = target.prototype[key];
      if (typeof method !== "function") continue;
      const routeEntries = (getMeta(method, ROUTE_HANDLERS) ?? []) as RouteHandlerMetadata[];
      const rawParams = (getMeta(method, PARAM_METADATA) ?? []) as ParamMetadata[];
      deleteMeta(method, ROUTE_HANDLERS);
      deleteMeta(method, PARAM_METADATA);
      for (const entry of routeEntries) {
        if (rawParams.length > 0) {
          entry.paramMetadata = rawParams.map((p, i) => ({ ...p, index: i }));
        }
        routes.push(entry);
      }
    }
    setMeta(target, ROUTE_HANDLERS, routes);
  };
}

/**
 * Method decorator that registers a GET endpoint.
 * @param path - The route path (default "/").
 *
 * @example
 * ```ts
 * @Get("/hello")
 * hello() { return { msg: "world" }; }
 * ```
 */
export function Get(path = "/") {
  return createRouteDecorator("GET", path);
}

/**
 * Method decorator that registers a POST endpoint.
 * @param path - The route path (default "/").
 *
 * @example
 * ```ts
 * @Post("/users")
 * create() { return { created: true }; }
 * ```
 */
export function Post(path = "/") {
  return createRouteDecorator("POST", path);
}

/**
 * Method decorator that registers a PUT endpoint.
 * @param path - The route path (default "/").
 *
 * @example
 * ```ts
 * @Put("/users/:id")
 * update() { return { updated: true }; }
 * ```
 */
export function Put(path = "/") {
  return createRouteDecorator("PUT", path);
}

/**
 * Method decorator that registers a DELETE endpoint.
 * @param path - The route path (default "/").
 *
 * @example
 * ```ts
 * @Delete("/users/:id")
 * remove() { return { deleted: true }; }
 * ```
 */
export function Delete(path = "/") {
  return createRouteDecorator("DELETE", path);
}

/**
 * Method decorator that registers a PATCH endpoint.
 * @param path - The route path (default "/").
 *
 * @example
 * ```ts
 * @Patch("/users/:id")
 * partialUpdate() { return { patched: true }; }
 * ```
 */
export function Patch(path = "/") {
  return createRouteDecorator("PATCH", path);
}

function createRouteDecorator(method: RouteHandlerMetadata["method"], path: string) {
  return (target: object, context: ClassMethodDecoratorContext) => {
    const entry: RouteHandlerMetadata = {
      method,
      path,
      propertyKey: context.name,
      guards: [],
      interceptors: [],
      paramMetadata: [],
    };
    const existing = (getMeta(target, ROUTE_HANDLERS) ?? []) as RouteHandlerMetadata[];
    existing.push(entry);
    setMeta(target, ROUTE_HANDLERS, existing);
  };
}
