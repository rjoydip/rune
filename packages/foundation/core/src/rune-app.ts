import { Container } from "@rune/container";
import { Router } from "@rune/router";
import { MiddlewarePipeline, type Middleware } from "./middleware-pipeline.js";
import { ModuleLoader } from "./module-loader.js";
import { Context } from "./context.js";

const JSON_HEADERS = { "content-type": "application/json" as const };

/**
 * Options for configuring a RuneApp instance.
 */
export interface RuneAppOptions {
  container?: Container;
  router?: Router;
}

/**
 * Core application class that wires together the DI container, router,
 * middleware pipeline, and module loader.
 *
 * @example
 * ```ts
 * const app = new RuneApp();
 * app.use(logger());
 * app.registerModule(AppModule);
 * app.init();
 * const res = await app.fetch(new Request("http://localhost/"));
 * ```
 */
export class RuneApp {
  readonly container: Container;
  readonly router: Router;
  readonly pipeline: MiddlewarePipeline;

  private moduleLoader: ModuleLoader;
  private initialized = false;
  private readonly initHooks: (() => Promise<void>)[] = [];
  private readonly destroyHooks: (() => Promise<void>)[] = [];

  /**
   * @param options - Optional container and router overrides.
   */
  constructor(options: RuneAppOptions = {}) {
    this.container = options.container ?? new Container();
    this.router = options.router ?? new Router();
    this.pipeline = new MiddlewarePipeline();
    this.moduleLoader = new ModuleLoader(this.container, this.router);
  }

  /**
   * Register an on-init lifecycle hook.
   */
  // fallow-ignore-next-line unused-class-member
  onInit(hook: () => Promise<void>): this {
    this.initHooks.push(hook);
    return this;
  }

  /**
   * Register an on-destroy lifecycle hook.
   */
  // fallow-ignore-next-line unused-class-member
  onDestroy(hook: () => Promise<void>): this {
    this.destroyHooks.push(hook);
    return this;
  }

  /**
   * Register a middleware function.
   * @param middleware - The middleware to add.
   *
   * @example
   * ```ts
   * app.use(cors());
   * ```
   */
  // fallow-ignore-next-line unused-class-member
  use(middleware: Middleware): this {
    this.pipeline.use(middleware);
    return this;
  }

  /**
   * Load a module and register its controllers and providers.
   * @param moduleClass - The module class decorated with @Module.
   *
   * @example
   * ```ts
   * app.registerModule(AppModule);
   * ```
   */
  // fallow-ignore-next-line unused-class-member
  registerModule(moduleClass: new (...args: never[]) => unknown): this {
    this.moduleLoader.load(moduleClass);
    return this;
  }

  /**
   * Finalize initialization. Safe to call multiple times.
   * Runs all registered on-init hooks concurrently.
   *
   * @example
   * ```ts
   * await app.init();
   * ```
   */
  async init(): Promise<void> {
    if (this.initialized) return;
    this.pipeline.seal();
    await Promise.all(this.initHooks.map((hook) => hook()));
    this.initialized = true;
  }

  /**
   * Gracefully shut down the application.
   * Runs all on-destroy lifecycle hooks concurrently.
   * Resets initialized state so fetch() re-initializes on next call.
   *
   * @example
   * ```ts
   * await app.destroy();
   * ```
   */
  // fallow-ignore-next-line unused-class-member
  async destroy(): Promise<void> {
    await Promise.all(this.destroyHooks.map((hook) => hook()));
    this.initialized = false;
  }

  /**
   * Handle an incoming HTTP request through the middleware pipeline
   * and router.
   * @param request - The incoming HTTP request.
   * @returns A Response.
   *
   * @example
   * ```ts
   * const res = await app.fetch(new Request("http://localhost/api"));
   * ```
   */
  fetch = async (request: Request): Promise<Response> => {
    if (!this.initialized) {
      await this.init();
    }

    const pathStart = request.url.indexOf("/", 8);
    const qmark = request.url.indexOf("?", pathStart);
    const pathname =
      qmark === -1 ? request.url.slice(pathStart) : request.url.slice(pathStart, qmark);

    const match = this.router.match(request.method, pathname);

    let context: Context;
    let handler: Middleware;

    if (match) {
      context = new Context(request, match.params, this.container);
      handler = async (ctx) => {
        ctx.state.set("__ctx", ctx);
        return ctx.response ?? match.handler(ctx.request, match.params, ctx.state);
      };

      if (this.pipeline.sealedNoMiddleware) {
        context.state.set("__ctx", context);
        try {
          const result = await match.handler(context.request, match.params, context.state);
          if (result instanceof Response) context.response = result;
          return context.response ?? new Response("Not Found", { status: 404 });
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          return new Response(JSON.stringify({ error: message }), {
            status: 500,
            headers: JSON_HEADERS,
          });
        }
      }
    } else {
      context = new Context(request, {}, this.container);
      handler = async () => new Response("Not Found", { status: 404 });
    }

    try {
      const composed = this.pipeline.compose(handler);
      await composed(context);
      return context.response ?? new Response("Not Found", { status: 404 });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return new Response(JSON.stringify({ error: message }), {
        status: 500,
        headers: JSON_HEADERS,
      });
    }
  };
}

/**
 * Create a new RuneApp instance.
 * @param options - Optional configuration.
 *
 * @example
 * ```ts
 * const app = createApp({ container: new Container() });
 * ```
 */
export function createApp(options?: RuneAppOptions): RuneApp {
  return new RuneApp(options);
}
