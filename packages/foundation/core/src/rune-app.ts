import { Container } from "@rune/container";
import { Router } from "@rune/router";
import { MiddlewarePipeline, type Middleware } from "./middleware-pipeline.js";
import { ModuleLoader } from "./module-loader.js";
import { Context } from "./context.js";

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
   * Register a middleware function.
   * @param middleware - The middleware to add.
   *
   * @example
   * ```ts
   * app.use(cors());
   * ```
   */
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
  registerModule(moduleClass: new (...args: never[]) => unknown): this {
    this.moduleLoader.load(moduleClass);
    return this;
  }

  /**
   * Finalize initialization. Safe to call multiple times.
   *
   * @example
   * ```ts
   * app.init();
   * ```
   */
  init(): void {
    if (this.initialized) return;
    this.initialized = true;
    this.pipeline.seal();
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
      this.init();
    }

    const pathStart = request.url.indexOf("/", 8);
    const qmark = request.url.indexOf("?", pathStart);
    const pathname =
      qmark === -1 ? request.url.slice(pathStart) : request.url.slice(pathStart, qmark);

    const match = this.router.match(request.method, pathname);

    const params = match ? match.params : {};
    const context = new Context(request, params, this.container);

    const handler: Middleware = async (ctx) => {
      if (!match) {
        return new Response("Not Found", { status: 404 });
      }
      return ctx.response ?? match.handler(ctx.request, match.params, ctx.state);
    };

    const composed = this.pipeline.compose(handler);

    try {
      await composed(context);
      return context.response ?? new Response("Not Found", { status: 404 });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return new Response(JSON.stringify({ error: message }), {
        status: 500,
        headers: { "content-type": "application/json" },
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
