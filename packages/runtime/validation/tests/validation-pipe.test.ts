import { describe, it, expect } from "bun:test";
import { ValidationPipe, ValidationErrorBag } from "../src/validation-pipe";

describe("validation-pipe", () => {
  const pipe = new ValidationPipe();

  // Skipped: class-validator's @IsString() etc. expect experimental decorator
  // signature which is incompatible with native decorators.
  // Users should use class-validator with experimentalDecorators: true.

  it("passes through non-class values", async () => {
    const result = await pipe.transform("raw string", undefined as any);
    expect(result).toBe("raw string");
  });

  it("passes through when metatype is not a class", async () => {
    const result = await pipe.transform({ foo: "bar" }, null as any);
    expect(result).toEqual({ foo: "bar" });
  });

  it("passes through when metatype is an arrow function (no prototype)", async () => {
    const result = await pipe.transform({ foo: "bar" }, (() => {}) as any);
    expect(result).toEqual({ foo: "bar" });
  });
});

describe("ValidationErrorBag", () => {
  it("is an Error with name ValidationErrorBag", () => {
    const err = new ValidationErrorBag([]);
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe("ValidationErrorBag");
    expect(err.message).toBe("Validation failed");
    expect(err.errors).toEqual([]);
  });
});
