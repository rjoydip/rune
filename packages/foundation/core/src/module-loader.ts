import { Container, Scope } from "@rune/container";
import type { IContainer } from "@rune/container";
import {
  MODULE_METADATA,
  INJECTABLE_SCOPE,
  CONTROLLER_PREFIX,
  ROUTE_HANDLERS,
  GUARD_METADATA,
  INTERCEPTOR_METADATA,
  DEPENDENCY_METADATA,
  getMeta,
} from "@rune/decorators";
import type { ModuleMetadata, RouteHandlerMetadata } from "@rune/decorators";
import { Router, type RouteHandler } from "@rune/router";
import { ValidationPipe } from "@rune/validation";
import { Context } from "./context.ts";

const providerCache = new Map<string, new (...args: never[]) => unknown>();
const dependencyMap = new WeakMap<
  new (...args: never[]) => unknown,
  (new (...args: never[]) => unknown)[]
>();

/**
 * Loads decorated modules, registers their controllers and providers
 * with the DI container, and wires routes into the router.
 *
 * @example
 * ```ts
 * const loader = new ModuleLoader(container, router);
 * loader.load(MyModule);
 * ```
 */
export class ModuleLoader {
  private readonly container: Container;
  private readonly router: Router;
  private readonly validationPipe: ValidationPipe;

  constructor(container: Container, router: Router) {
    this.container = container;
    this.router = router;
    this.validationPipe = new ValidationPipe();
  }

  /**
   * Recursively load a module and its imports.
   * @param rootModule - The root module class decorated with @Module.
   */
  load(rootModule: new (...args: never[]) => unknown): void {
    this.loadModule(rootModule, new Set());
  }

  private loadModule(moduleClass: new (...args: never[]) => unknown, visited: Set<unknown>): void {
    if (visited.has(moduleClass)) return;
    visited.add(moduleClass);
    const metadata: ModuleMetadata | undefined = getMeta(moduleClass, MODULE_METADATA) as
      | ModuleMetadata
      | undefined;
    if (!metadata) {
      throw new Error(`@Module() metadata not found on ${moduleClass.name}`);
    }
    for (const importClass of metadata.imports) {
      this.loadModule(importClass as new (...args: never[]) => unknown, visited);
    }
    for (const provider of metadata.providers) {
      this.registerProvider(provider as new (...args: never[]) => unknown);
    }
    const moduleGuards = metadata.providers.filter(
      (p) => typeof p === "function" && (p.name.endsWith("Guard") || "canActivate" in p.prototype),
    ) as (new (...args: never[]) => unknown)[];
    for (const controller of metadata.controllers) {
      this.registerController(controller as new (...args: never[]) => unknown, moduleGuards);
    }
  }

  private registerProvider(provider: new (...args: never[]) => unknown): void {
    const scope = this.getInjectableScope(provider);
    const providerName = (provider as any).name;
    if (providerName) {
      providerCache.set(providerName.toLowerCase(), provider);
    }
    const deps = this.resolveDependencies(provider);
    if (deps.length > 0) {
      dependencyMap.set(provider, deps);
    }
    this.container.register({
      token: provider,
      useFactory: (_c: IContainer) => {
        const resolvedDeps = deps.map((dep) => {
          try {
            return this.container.resolve(dep);
          } catch {
            return undefined;
          }
        });
        return new (provider as any)(...resolvedDeps);
      },
      scope: scope as unknown as Scope,
    });
  }

  private registerController(
    controller: new (...args: never[]) => unknown,
    moduleGuards: (new (...args: never[]) => unknown)[] = [],
  ): void {
    const prefix: string = (getMeta(controller, CONTROLLER_PREFIX) as string) ?? "/";
    const routes: RouteHandlerMetadata[] =
      (getMeta(controller, ROUTE_HANDLERS) as RouteHandlerMetadata[]) ?? [];
    const controllerGuards: (new (...args: never[]) => unknown)[] = [
      ...moduleGuards,
      ...((getMeta(controller, GUARD_METADATA) as (new (...args: never[]) => unknown)[]) ?? []),
    ];
    const deps = this.resolveDependencies(controller);
    if (deps.length > 0) {
      dependencyMap.set(controller, deps);
    }
    this.container.register({
      token: controller,
      useFactory: (_c: IContainer) => {
        const resolvedDeps = deps.map((dep) => {
          try {
            return this.container.resolve(dep);
          } catch {
            return undefined;
          }
        });
        return new (controller as any)(...resolvedDeps);
      },
      scope: Scope.Request,
    });
    for (const route of routes) {
      route.paramMetadata.sort((a, b) => a.index - b.index);
      const fullPath = this.joinPaths(prefix, route.path);
      const methodFn = (controller.prototype as any)[route.propertyKey];
      const methodGuardsMeta = methodFn
        ? (getMeta(methodFn, GUARD_METADATA) as (new (...args: never[]) => unknown)[] | undefined)
        : undefined;
      const methodInterceptorsMeta = methodFn
        ? (getMeta(methodFn, INTERCEPTOR_METADATA) as
            | (new (...args: never[]) => unknown)[]
            | undefined)
        : undefined;
      const routeGuards = methodFn ? (methodGuardsMeta ?? []) : [];
      const routeInterceptors = methodFn ? (methodInterceptorsMeta ?? []) : [];
      const methodGuards = [...controllerGuards, ...routeGuards, ...route.guards];
      const methodInterceptors = [...routeInterceptors, ...route.interceptors];
      const handler: RouteHandler = async (request, params, _context) => {
        const requestScope = new Map<string, unknown>();
        requestScope.set("request", request);
        requestScope.set("params", params);
        const scopedContainer = this.container.createScope();
        const context = new Context(request, params, scopedContainer);
        const instance = scopedContainer.resolve(controller) as Record<string, unknown>;
        const guardResults = await Promise.all(
          methodGuards.map(async (Guard) => {
            const guard = scopedContainer.resolve(Guard) as {
              canActivate: (ctx: Context) => boolean | Promise<boolean>;
            };
            return guard.canActivate(context);
          }),
        );
        if (guardResults.some((allowed) => !allowed)) {
          return new Response("Forbidden", { status: 403 });
        }
        let pipeline = () => this.executeHandler(instance, route, context, request);
        for (let i = methodInterceptors.length - 1; i >= 0; i--) {
          const Interceptor = methodInterceptors[i];
          const interceptor = scopedContainer.resolve(Interceptor) as {
            intercept: (ctx: Context, next: () => Promise<Response>) => Promise<Response>;
          };
          const next = pipeline;
          pipeline = () => interceptor.intercept(context, next);
        }
        const result = await pipeline();
        if (result) return result;
        return this.executeHandler(instance, route, context, request);
      };
      this.router.add(route.method, fullPath, handler);
    }
  }

  private async executeHandler(
    instance: Record<string, unknown>,
    route: RouteHandlerMetadata,
    context: Context,
    request: Request,
  ): Promise<Response> {
    const method = (instance as any)[route.propertyKey] as (...args: unknown[]) => unknown;
    const sortedParams = route.paramMetadata.map(async (param) => {
      switch (param.type) {
        case "body": {
          const raw = await request.clone().json();
          if (param.dto) {
            return this.validationPipe.transform(raw, param.dto as any);
          }
          return raw;
        }
        case "param":
          return (
            context.params[param.index] ?? context.params[Object.keys(context.params)[param.index]]
          );
        case "query": {
          const query = context.query;
          const keys = Object.keys(query);
          const val = query[keys[param.index]] ?? Object.values(query)[param.index];
          if (param.dto) {
            return this.validationPipe.transform(query, param.dto as any);
          }
          return val;
        }
        case "headers":
          return Object.fromEntries((request.headers as any).entries());
        case "context":
          return context;
        default:
          return undefined;
      }
    });
    let args: unknown[];
    try {
      args = await Promise.all(sortedParams);
    } catch {
      args = [];
    }
    if (route.paramMetadata.length === 0 && method.length > 0) {
      args = [context];
    }
    const result = await method.call(instance, ...args);
    if (result instanceof Response) {
      return result;
    }
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }

  private resolveDependencies(
    target: new (...args: never[]) => unknown,
  ): (new (...args: never[]) => unknown)[] {
    const explicitDeps = getMeta(target, DEPENDENCY_METADATA) as
      | (new (...args: never[]) => unknown)[]
      | undefined;
    if (explicitDeps && explicitDeps.length > 0) {
      return explicitDeps;
    }
    const ctorStr = target.toString();
    const match = ctorStr.match(/constructor\s*\(([^)]*)\)/);
    if (!match) return [];
    const params = match[1]
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const deps: (new (...args: never[]) => unknown)[] = [];
    for (const param of params) {
      const typeMatch = param.match(/:\s*(\w+)/);
      if (!typeMatch) continue;
      const typeName = typeMatch[1].toLowerCase();
      const cached = providerCache.get(typeName);
      if (cached) {
        deps.push(cached);
      }
    }
    return deps;
  }

  private getInjectableScope(target: unknown): string {
    const metadata = getMeta(target as any, INJECTABLE_SCOPE) as { scope: string } | undefined;
    return metadata?.scope ?? "singleton";
  }

  private joinPaths(...paths: string[]): string {
    return paths
      .map((p) => p.replace(/^\/+|\/+$/g, ""))
      .filter(Boolean)
      .join("/")
      .replace(/\/+/g, "/")
      .replace(/^\/?/, "/");
  }
}
