import { describe, it, expect } from "bun:test";
import { getSwaggerHTML } from "../src/swagger-ui";

describe("swagger-ui", () => {
  it("returns HTML string", () => {
    const html = getSwaggerHTML();
    expect(html).toBeTypeOf("string");
    expect(html).toContain("swagger-ui");
    expect(html).toContain("openapi.json");
  });
});
