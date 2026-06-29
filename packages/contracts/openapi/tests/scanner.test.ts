import { describe, it, expect } from "bun:test";

import { OpenAPIScanner } from "../src/scanner";

import { Module, Controller, Get, Post, Body, Param, Query, Headers } from "@rune/decorators";

describe("OpenAPIScanner", () => {
  it("scans empty module", () => {
    @Module({ controllers: [], providers: [], imports: [], exports: [] })
    class AppModule {}

    const scanner = new OpenAPIScanner("Test", "0.1.0");

    const spec = scanner.scan(AppModule);

    expect(spec.openapi).toBe("3.0.3");

    expect(spec.info.title).toBe("Test");

    expect(spec.info.version).toBe("0.1.0");

    expect(spec.paths).toEqual({});
  });

  it("generates paths from controllers", () => {
    @Controller("/users")
    class UserController {
      @Get("/")
      list() {}

      @Post("/")
      @Body()
      create(_data: unknown) {}
    }

    @Module({
      controllers: [UserController],

      providers: [],

      imports: [],

      exports: [],
    })
    class AppModule {}

    const scanner = new OpenAPIScanner();

    const spec = scanner.scan(AppModule);

    expect(spec.paths["/users"]).toBeDefined();
  });

  it("generates paths with parameters and request bodies", () => {
    @Controller("/api")
    class ApiController {
      @Get("/items/:id")
      @Param()
      getItem(_id: string) {}

      @Post("/items")
      @Body()
      createItem(_data: unknown) {}
    }

    @Module({
      controllers: [ApiController],

      providers: [],

      imports: [],

      exports: [],
    })
    class AppModule {}

    const scanner = new OpenAPIScanner();

    const spec = scanner.scan(AppModule);

    expect(spec.paths["/api/items/:id"]).toBeDefined();

    expect(spec.paths["/api/items/:id"]!.get).toBeDefined();

    expect(spec.paths["/api/items"]).toBeDefined();

    expect(spec.paths["/api/items"]!.post).toBeDefined();

    expect((spec.paths["/api/items"]!.post as any).requestBody).toBeDefined();
  });

  it("generates parameters with correct types for param, query, header", () => {
    @Controller("/test")
    class TestController {
      @Get("/:id")
      @Param()
      @Query()
      @Headers()
      get(_id: string, _q: string, _h: string) {}
    }

    @Module({
      controllers: [TestController],
      providers: [],
      imports: [],
      exports: [],
    })
    class AppModule {}

    const scanner = new OpenAPIScanner();
    const spec = scanner.scan(AppModule);

    const parameters = (spec.paths["/test/:id"]!.get as any).parameters;
    expect(parameters).toHaveLength(3);

    const paramNames = parameters.map((p: any) => p.in);
    expect(paramNames).toContain("path");
    expect(paramNames).toContain("query");
    expect(paramNames).toContain("headers");

    const pathParam = parameters.find((p: any) => p.in === "path");
    expect(pathParam.required).toBe(true);

    const queryParam = parameters.find((p: any) => p.in === "query");
    expect(queryParam.required).toBe(false);
  });

  it("scans imported modules", () => {
    @Controller("/health")
    class HealthController {
      @Get("/")
      check() {
        return "ok";
      }
    }

    @Module({
      controllers: [HealthController],

      providers: [],

      imports: [],

      exports: [],
    })
    class HealthModule {}

    @Controller("/users")
    class UserController {
      @Get("/")
      list() {
        return [];
      }
    }

    @Module({
      controllers: [UserController],

      providers: [],

      imports: [HealthModule],

      exports: [],
    })
    class AppModule {}

    const scanner = new OpenAPIScanner();

    const spec = scanner.scan(AppModule);

    expect(spec.paths["/health"]).toBeDefined();

    expect(spec.paths["/users"]).toBeDefined();
  });

  it("handles modules without metadata gracefully", () => {
    class NotAModule {}

    const scanner = new OpenAPIScanner();

    const spec = scanner.scan(NotAModule as any);

    expect(spec.paths).toEqual({});
  });
});
