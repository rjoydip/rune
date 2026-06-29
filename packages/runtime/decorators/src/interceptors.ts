import { INTERCEPTOR_METADATA, setMeta } from "./metadata.ts";

/**
 * Decorator that attaches one or more interceptor classes to a controller or method.
 * Interceptors must implement `intercept(ctx, next): Promise<Response>`.
 *
 * @param interceptors - Interceptor classes to apply.
 *
 * @example
 * ```ts
 * @UseInterceptor(TimingInterceptor)
 * @Controller("/api")
 * class ApiController {
 *   @Get("/slow")
 *   @UseInterceptor(CacheInterceptor)
 *   slowOp() { return { data: "..." }; }
 * }
 * ```
 */
export function UseInterceptor(...interceptors: (new (...args: never[]) => unknown)[]) {
  return (target: object, context: ClassDecoratorContext | ClassMethodDecoratorContext) => {
    if (context.kind === "class") {
      setMeta(target, INTERCEPTOR_METADATA, interceptors);
    } else if (context.kind === "method") {
      setMeta(target, INTERCEPTOR_METADATA, interceptors);
    }
  };
}
