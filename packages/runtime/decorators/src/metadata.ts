/** Metadata key for stored route handler entries. */
export const ROUTE_HANDLERS = "rune:route-handlers";
/** Metadata key for the controller URL prefix. */
export const CONTROLLER_PREFIX = "rune:controller-prefix";
/** Metadata key for module configuration. */
export const MODULE_METADATA = "rune:module-metadata";
/** Metadata key for the injectable scope. */
export const INJECTABLE_SCOPE = "rune:injectable-scope";
/** Metadata key for guard classes. */
export const GUARD_METADATA = "rune:guards";
/** Metadata key for interceptor classes. */
export const INTERCEPTOR_METADATA = "rune:interceptors";
/** Metadata key for parameter decorator data. */
export const PARAM_METADATA = "rune:param-metadata";
/** Metadata key for DTO class references. */
export const DTO_METADATA = "rune:dto-metadata";
/** Metadata key for explicit constructor dependencies. */
export const DEPENDENCY_METADATA = "rune:deps";

const store = new WeakMap<object, Record<string, unknown>>();

/**
 * Store a metadata value on a target object.
 * @param target - The object to store metadata on.
 * @param key - The metadata key.
 * @param value - The value to store.
 *
 * @example
 * ```ts
 * setMeta(MyClass, "my:key", { data: 42 });
 * ```
 */
export function setMeta(target: object, key: string, value: unknown): void {
  let m = store.get(target);
  if (!m) {
    m = {};
    store.set(target, m);
  }
  m[key] = value;
}

/**
 * Retrieve metadata stored on a target object.
 * @param target - The object to read from.
 * @param key - The metadata key.
 * @returns The stored value, or undefined.
 *
 * @example
 * ```ts
 * const val = getMeta(MyClass, "my:key");
 * ```
 */
export function getMeta(target: object, key: string): unknown {
  return store.get(target)?.[key];
}

/**
 * Delete a metadata entry from a target object.
 * @param target - The object to modify.
 * @param key - The metadata key to remove.
 *
 * @example
 * ```ts
 * deleteMeta(MyClass, "temporary:key");
 * ```
 */
export function deleteMeta(target: object, key: string): void {
  const m = store.get(target);
  if (m) delete m[key];
}

/**
 * Retrieve all metadata stored on a target object.
 * @param target - The object to read from.
 * @returns A record of all key-value pairs.
 *
 * @example
 * ```ts
 * const all = getOwnMeta(MyClass);
 * ```
 */
export function getOwnMeta(target: object): Record<string, unknown> {
  return store.get(target) ?? {};
}

/**
 * List all metadata keys stored on a target object.
 * @param target - The object to inspect.
 * @returns An array of key strings.
 *
 * @example
 * ```ts
 * const keys = keysMeta(MyClass);
 * ```
 */
export function keysMeta(target: object): string[] {
  return Object.keys(store.get(target) ?? {});
}

/**
 * Describes a single route handler registered via decorators.
 */
export interface RouteHandlerMetadata {
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "HEAD" | "OPTIONS";
  path: string;
  propertyKey: string | symbol;
  guards: (new (...args: never[]) => unknown)[];
  interceptors: (new (...args: never[]) => unknown)[];
  paramMetadata: ParamMetadata[];
  dto?: new (...args: never[]) => unknown;
}

/**
 * Describes a single parameter decorator entry (Body, Param, Query, etc.).
 */
export interface ParamMetadata {
  index: number;
  type: "body" | "param" | "query" | "headers" | "context";
  dto?: new (...args: never[]) => unknown;
}

/**
 * Describes the configuration passed to a @Module decorator.
 */
export interface ModuleMetadata {
  controllers: (new (...args: never[]) => unknown)[];
  providers: (new (...args: never[]) => unknown)[];
  imports: (new (...args: never[]) => unknown)[];
  exports: (new (...args: never[]) => unknown)[];
}

/**
 * Describes the scope configuration for an @Injectable decorator.
 */
export interface InjectableMetadata {
  scope: "singleton" | "transient" | "request";
}

export function joinPaths(...paths: string[]): string {
  return paths
    .map((p) => p.replace(/^\/+|\/+$/g, ""))
    .filter(Boolean)
    .join("/")
    .replace(/\/+/g, "/")
    .replace(/^\/?/, "/");
}
