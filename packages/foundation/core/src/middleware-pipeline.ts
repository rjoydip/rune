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
  private composed:
    | ((handler: Middleware) => (context: Context) => Promise<Response | void>)
    | null = null;

  use(middleware: Middleware): void {
    this.middlewares.push(middleware);
  }

  seal(): void {
    this.sealed = true;
    if (this.middlewares.length === 0) {
      this.composed = (handler: Middleware) => async (context: Context) => {
        const result = await handler(context, () => Promise.resolve());
        if (result instanceof Response) context.response = result;
        return result;
      };
    } else {
      const stack = this.middlewares;
      this.composed = (handler: Middleware) => {
        const total = stack.length + 1;
        const dispatch = async (context: Context, i: number): Promise<Response | void> => {
          if (i >= total) return;
          const middleware = i < stack.length ? stack[i] : handler;
          const next = () => dispatch(context, i + 1);
          const result = await middleware(context, next);
          if (result instanceof Response) context.response = result;
          return result;
        };
        return (context: Context) => dispatch(context, 0);
      };
    }
  }

  compose(handler: Middleware): (context: Context) => Promise<Response | void> {
    if (this.composed) return this.composed(handler);
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
