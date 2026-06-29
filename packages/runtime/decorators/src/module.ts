import { MODULE_METADATA, setMeta } from "./metadata.ts";
import type { ModuleMetadata } from "./metadata.ts";

/**
 * Class decorator that marks a class as a module and provides its metadata.
 * @param metadata - Module configuration with controllers, providers, imports, and exports.
 *
 * @example
 * ```ts
 * @Module({
 *   controllers: [UserController],
 *   providers: [UserService],
 *   imports: [DatabaseModule],
 *   exports: [UserService],
 * })
 * class UserModule {}
 * ```
 */
export function Module(metadata: ModuleMetadata) {
  return (target: object, _context: ClassDecoratorContext) => {
    setMeta(target, MODULE_METADATA, metadata);
  };
}
