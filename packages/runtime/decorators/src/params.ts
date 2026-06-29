import { PARAM_METADATA, DTO_METADATA, setMeta, getMeta } from "./metadata.ts";
import type { ParamMetadata } from "./metadata.ts";

type NativeMethodDecorator = (
  target: object | undefined,
  context: ClassMethodDecoratorContext,
) => void;

function paramDecorator(type: ParamMetadata["type"]): NativeMethodDecorator {
  return (target: object | undefined, _context: ClassMethodDecoratorContext) => {
    if (!target) return;
    const dto = getMeta(target, DTO_METADATA);
    const existing = (getMeta(target, PARAM_METADATA) ?? []) as ParamMetadata[];
    existing.unshift({ index: 0, type, dto: dto as any });
    setMeta(target, PARAM_METADATA, existing);
  };
}

/**
 * Method decorator that injects the parsed request body.
 * Optionally accepts a DTO class for validation.
 *
 * @example
 * ```ts
 * @Post("/users")
 * @Body(CreateUserDto)
 * create(data: CreateUserDto) { ... }
 * ```
 */
export function Body(dto?: new (...args: never[]) => unknown): NativeMethodDecorator {
  return (target: object | undefined, context: ClassMethodDecoratorContext) => {
    if (!target) return;
    if (dto) setMeta(target, DTO_METADATA, dto);
    paramDecorator("body")(target, context);
  };
}

/**
 * Method decorator that injects URL path parameters.
 *
 * @example
 * ```ts
 * @Get("/users/:id")
 * @Param()
 * getUser(id: string) { ... }
 * ```
 */
export function Param(dto?: new (...args: never[]) => unknown): NativeMethodDecorator {
  return (target: object | undefined, context: ClassMethodDecoratorContext) => {
    if (!target) return;
    if (dto) setMeta(target, DTO_METADATA, dto);
    paramDecorator("param")(target, context);
  };
}

/**
 * Method decorator that injects query string parameters.
 *
 * @example
 * ```ts
 * @Get("/search")
 * @Query()
 * search(q: string) { ... }
 * ```
 */
export function Query(dto?: new (...args: never[]) => unknown): NativeMethodDecorator {
  return (target: object | undefined, context: ClassMethodDecoratorContext) => {
    if (!target) return;
    if (dto) setMeta(target, DTO_METADATA, dto);
    paramDecorator("query")(target, context);
  };
}

/**
 * Method decorator that injects request headers.
 *
 * @example
 * ```ts
 * @Get("/protected")
 * @Headers()
 * read(headers: Record<string, string>) { ... }
 * ```
 */
export function Headers(dto?: new (...args: never[]) => unknown): NativeMethodDecorator {
  return (target: object | undefined, context: ClassMethodDecoratorContext) => {
    if (!target) return;
    if (dto) setMeta(target, DTO_METADATA, dto);
    paramDecorator("headers")(target, context);
  };
}

/**
 * Method decorator that injects the full Context object.
 *
 * @example
 * ```ts
 * @Get("/context")
 * @Req()
 * handle(ctx: Context) { ... }
 * ```
 */
export function Req(dto?: new (...args: never[]) => unknown): NativeMethodDecorator {
  return (target: object | undefined, context: ClassMethodDecoratorContext) => {
    if (!target) return;
    if (dto) setMeta(target, DTO_METADATA, dto);
    paramDecorator("context")(target, context);
  };
}
