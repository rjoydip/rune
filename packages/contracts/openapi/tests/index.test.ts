import { describe, it, expect } from "bun:test";
import * as OpenAPI from "../src/index";

describe("openapi exports", () => {
  it("exports OpenAPIScanner", () => {
    expect(OpenAPI.OpenAPIScanner).toBeDefined();
  });

  it("exports getSwaggerHTML", () => {
    expect(OpenAPI.getSwaggerHTML).toBeTypeOf("function");
  });
});
