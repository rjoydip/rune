import { describe, it, expect } from "bun:test";
import { ValidationPipe, ValidationErrorBag } from "../src/index";

describe("validation exports", () => {
  it("exports ValidationPipe", () => {
    expect(ValidationPipe).toBeDefined();
    expect(new ValidationPipe()).toBeInstanceOf(ValidationPipe);
  });

  it("exports ValidationErrorBag", () => {
    expect(ValidationErrorBag).toBeDefined();
  });
});
