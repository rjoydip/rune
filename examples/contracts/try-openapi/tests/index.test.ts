import { describe, it, expect } from "bun:test";
import { OpenAPIScanner, getSwaggerHTML } from "@rune/openapi";
import { Module } from "@rune/decorators";

describe("try-openapi", () => {
  it("scans module and generates spec", () => {
    @Module({ controllers: [], providers: [], imports: [], exports: [] })
    class TestModule {}

    const scanner = new OpenAPIScanner("Test", "0.1.0");
    const spec = scanner.scan(TestModule);
    expect(spec.openapi).toBe("3.0.3");
    expect(spec.info.title).toBe("Test");
    expect(spec.info.version).toBe("0.1.0");
  });

  it("generates swagger HTML", () => {
    const html = getSwaggerHTML();
    expect(html).toContain("swagger-ui");
  });
});
