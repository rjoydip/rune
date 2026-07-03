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
  joinPaths,
} from "@rune/decorators";
import type { ModuleMetadata, RouteHandlerMetadata } from "@rune/decorators";
import { Router, type RouteHandler } from "@rune/router";
import { ValidationPipe } from "@rune/validation";
import { Context } from "./context.js";
import { createLazySerializer } from "./json-serializer.js";

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
    const deps = this.resolveDependencies(provider);
    this.container.register({
      token: provider,
      useFactory: (c: IContainer) => {
        const resolvedDeps = deps.map((dep) => {
          try {
            return c.resolve(dep);
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
    this.container.register({
      token: controller,
      useFactory: (c: IContainer) => {
        const resolvedDeps = deps.map((dep) => {
          try {
            return c.resolve(dep);
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
      const fullPath = joinPaths(prefix, route.path);
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
      const isSimple =
        deps.length === 0 &&
        methodGuards.length === 0 &&
        methodInterceptors.length === 0 &&
        !route.paramMetadata.some((p) => p.dto);
      if (isSimple) {
        // Fast path: controller is pre-instantiated once at init time.
        // The instance is SHARED across all requests — it must be stateless.
        // Any mutable state (e.g., this.count++) will race across concurrent requests.
        const instance = new (controller as any)();
        const method = (instance as any)[route.propertyKey] as Function;
        const serialize = createLazySerializer();
        const extractors = route.paramMetadata.map((param) => {
          switch (param.type) {
            case "body":
              return (_req: Request, _params: Record<string, string>, ctx: Context) => ctx.body;
            case "param":
              return (_req: Request, _params: Record<string, string>, ctx: Context) =>
                ctx.paramsArray[param.index];
            case "query":
              return (_req: Request, _params: Record<string, string>, ctx: Context) =>
                ctx.queryValues[param.index];
            case "headers":
              return (req: Request, _params: Record<string, string>, _ctx: Context) =>
                Object.fromEntries(req.headers.entries());
            case "context":
              return (_req: Request, _params: Record<string, string>, ctx: Context) => ctx;
            default:
              return () => undefined;
          }
        });
        const handler: RouteHandler = async (request, params, _context) => {
          const pipelineCtx = _context?.get?.("__ctx") as Context | undefined;
          const context = pipelineCtx ?? new Context(request, params, this.container);
          const rawArgs = await Promise.all(extractors.map((e) => e(request, params, context)));
          const args = extractors.length === 0 && method.length > 0 ? [context] : rawArgs;
          const result = await method.call(instance, ...args);
          if (result instanceof Response) {
            return result;
          }
          return new Response(serialize(result), {
            status: 200,
            headers: { "content-type": "application/json" },
          });
        };
        this.router.add(route.method, fullPath, handler);
      } else {
        const handler: RouteHandler = async (request, params, _context) => {
          const scopedContainer = this.container.createScope();
          const pipelineCtx = _context?.get?.("__ctx") as Context | undefined;
          const context = pipelineCtx ?? new Context(request, params, scopedContainer);
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
          return pipeline();
        };
        this.router.add(route.method, fullPath, handler);
      }
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
          const raw = await context.body;
          if (param.dto) {
            return this.validationPipe.transform(raw, param.dto as any);
          }
          return raw;
        }
        case "param":
          return context.paramsArray[param.index];
        case "query":
          return context.queryValues[param.index];
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
    return [];
  }

  private getInjectableScope(target: unknown): string {
    const metadata = getMeta(target as any, INJECTABLE_SCOPE) as { scope: string } | undefined;
    return metadata?.scope ?? "singleton";
  }
}
