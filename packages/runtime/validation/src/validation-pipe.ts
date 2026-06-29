import { plainToInstance } from "class-transformer";
import { validate, type ValidationError } from "class-validator";

/**
 * Error thrown when validation of a payload fails.
 * Carries the list of validation errors from class-validator.
 *
 * @example
 * ```ts
 * try {
 *   await pipe.transform(input, CreateUserDto);
 * } catch (err) {
 *   if (err instanceof ValidationErrorBag) {
 *     console.error(err.errors);
 *   }
 * }
 * ```
 */
export class ValidationErrorBag extends Error {
  /**
   * @param errors - Array of ValidationError objects describing what failed validation.
   */
  constructor(public readonly errors: ValidationError[]) {
    super("Validation failed");
    this.name = "ValidationErrorBag";
  }
}

/**
 * Pipe that transforms a plain value into a typed DTO instance and runs class-validator validation.
 *
 * @example
 * ```ts
 * const pipe = new ValidationPipe();
 * const dto = await pipe.transform(reqBody, CreateUserDto);
 * ```
 */
export class ValidationPipe {
  /**
   * Transform and validate a plain value against the given DTO class.
   * @param value - The raw input value to validate.
   * @param metatype - The DTO class constructor to instantiate and validate against.
   * @returns The validated and transformed DTO instance.
   * @throws {ValidationErrorBag} When validation constraints are violated.
   *
   * @example
   * ```ts
   * class CreateUserDto {
   *   @IsString()
   *   @IsNotEmpty()
   *   name!: string;
   * }
   * const validated = await pipe.transform({ name: "Alice" }, CreateUserDto);
   * ```
   */
  async transform<T extends object>(
    value: unknown,
    metatype: new (...args: any[]) => T,
  ): Promise<any> {
    if (!metatype || !this.isDtoClass(metatype)) {
      return value;
    }

    const object = plainToInstance(metatype, value, {
      excludeExtraneousValues: false,
      enableImplicitConversion: false,
    });

    const errors = await validate(object, {
      whitelist: true,
      forbidNonWhitelisted: false,
      stopAtFirstError: false,
    });

    const filteredErrors = errors.filter(
      (err) => !err.constraints || !err.constraints.unknownValue,
    );
    if (filteredErrors.length > 0) {
      throw new ValidationErrorBag(filteredErrors);
    }

    return object;
  }

  /**
   * Checks whether a given value is a DTO class (a function with a prototype).
   * @param metatype - The value to check.
   * @returns True if the value is a class-like function.
   */
  private isDtoClass(metatype: unknown): boolean {
    if (typeof metatype !== "function") return false;
    const prototype = (metatype as any).prototype;
    return prototype !== undefined && prototype !== null;
  }
}
