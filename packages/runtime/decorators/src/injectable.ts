import { INJECTABLE_SCOPE, setMeta } from "./metadata.js";

/**
 * Class decorator that marks a class as injectable by the DI container.
 * @param scope - The injection scope: "singleton", "transient", or "request" (default "singleton").
 *
 * @example
 * ```ts
 * @Injectable()
 * class Logger {
 *   log(msg: string) { console.log(msg); }
 * }
 *
 * @Injectable("request")
 * class RequestContext {
 *   get userId() { return "..." }
 * }
 * ```
 */
export function Injectable(
  scope: "singleton" | "transient" | "request" = "singleton",
): (target: object, _context: ClassDecoratorContext) => void {
  return (target: object, _context: ClassDecoratorContext) => {
    setMeta(target, INJECTABLE_SCOPE, { scope });
  };
}
