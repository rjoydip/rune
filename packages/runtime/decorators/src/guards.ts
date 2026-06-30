import { GUARD_METADATA, setMeta } from "./metadata.js";

/**
 * Decorator that attaches one or more guard classes to a controller or method.
 * Guards must implement `canActivate(ctx): boolean | Promise<boolean>`.
 *
 * @param guards - Guard classes to apply.
 *
 * @example
 * ```ts
 * @UseGuard(AuthGuard)
 * @Controller("/admin")
 * class AdminController {
 *   @Get("/")
 *   @UseGuard(RoleGuard)
 *   list() { return []; }
 * }
 * ```
 */
export function UseGuard(
  ...guards: (new (...args: never[]) => unknown)[]
): (target: object, context: ClassDecoratorContext | ClassMethodDecoratorContext) => void {
  return (target: object, context: ClassDecoratorContext | ClassMethodDecoratorContext) => {
    if (context.kind === "class") {
      setMeta(target, GUARD_METADATA, guards);
    } else if (context.kind === "method") {
      setMeta(target, GUARD_METADATA, guards);
    }
  };
}
