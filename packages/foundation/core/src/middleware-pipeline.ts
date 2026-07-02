import type { Context } from "./context.js";

/**
 * Function called by a middleware to pass control to the next middleware
 * in the pipeline.
 */
export type NextFunction = () => Promise<Response | void>;

/**
 * A middleware function that receives the request context and a `next`
 * callback to pass control to the next middleware or the final handler.
 */
export type Middleware = (context: Context, next: NextFunction) => Promise<Response | void>;

/**
 * Composes an ordered list of middleware functions into a single handler.
 * Middleware execute in FIFO order with the final handler running last.
 *
 * @example
 * ```ts
 * const pipeline = new MiddlewarePipeline();
 * pipeline.use(logger);
 * pipeline.use(auth);
 * const composed = pipeline.compose(handler);
 * await composed(context);
 * ```
 */
export class MiddlewarePipeline {
  private readonly middlewares: Middleware[] = [];
  private sealed: boolean = false;

  /**
   * Register a middleware function at the end of the pipeline.
   * @param middleware - The middleware to add.
   *
   * @example
   * ```ts
   * pipeline.use(async (ctx, next) => {
   *   console.log("before");
   *   await next();
   *   console.log("after");
   * });
   * ```
   */
  use(middleware: Middleware): void {
    this.middlewares.push(middleware);
  }

  /**
   * Seal the pipeline so that no more middlewares can be registered.
   * Once sealed, compose() uses a snapshot of the middleware list.
   */
  seal(): void {
    this.sealed = true;
  }

  /**
   * Compose all registered middlewares with the given final handler
   * into a single callable function.
   * @param handler - The terminal handler invoked after all middleware.
   * @returns A composed function that accepts a Context.
   *
   * @example
   * ```ts
   * const composed = pipeline.compose(async (ctx) => {
   *   return new Response("ok");
   * });
   * await composed(context);
   * ```
   */
  compose(handler: Middleware): (context: Context) => Promise<Response | void> {
    if (this.middlewares.length === 0) {
      return async (context: Context) => {
        const result = await handler(context, () => Promise.resolve());
        if (result instanceof Response) context.response = result;
        return result;
      };
    }

    const stack = this.middlewares.concat(handler);

    return async (context: Context) => {
      let index = -1;

      const dispatch = async (i: number): Promise<Response | void> => {
        if (i <= index) throw new Error("next() called multiple times");
        index = i;

        if (i >= stack.length) return;
        const result = await stack[i](context, () => dispatch(i + 1));
        if (result instanceof Response) context.response = result;
        return result;
      };

      return dispatch(0);
    };
  }
}
