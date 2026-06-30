import { DEPENDENCY_METADATA, setMeta } from "./metadata.js";

/**
 * Class decorator that declares explicit constructor dependencies for DI.
 * @param deps - The dependency classes to inject.
 *
 * @example
 * ```ts
 * @Deps(Logger, Database)
 * class UserService {
 *   constructor(private logger: Logger, private db: Database) {}
 * }
 * ```
 */
export function Deps(
  ...deps: (new (...args: never[]) => unknown)[]
): (target: object, _context: ClassDecoratorContext) => void {
  return (target: object, _context: ClassDecoratorContext) => {
    setMeta(target, DEPENDENCY_METADATA, deps);
  };
}
