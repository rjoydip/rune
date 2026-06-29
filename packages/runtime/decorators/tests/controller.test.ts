import { describe, it, expect } from "bun:test";

import { Controller, Get, Post, Put, Delete, Patch, getMeta } from "../src/index";

import { CONTROLLER_PREFIX, ROUTE_HANDLERS } from "../src/metadata";

describe("Controller", () => {
  it("sets default prefix '/'", () => {
    @Controller()
    class Test {}

    expect(getMeta(Test, CONTROLLER_PREFIX)).toBe("/");
  });

  it("sets custom prefix", () => {
    @Controller("/api/v1")
    class Test {}

    expect(getMeta(Test, CONTROLLER_PREFIX)).toBe("/api/v1");
  });

  it("initializes route handlers metadata", () => {
    @Controller("/")
    class Test {
      @Get("/")
      list() {}
    }

    const routes = getMeta(Test, ROUTE_HANDLERS) as any[];

    expect(routes).toHaveLength(1);

    expect(routes[0].method).toBe("GET");
  });
});

describe("Route decorators", () => {
  it("Get stores correct method and path", () => {
    @Controller("/")
    class Test {
      @Get("/users")
      getUsers() {}
    }

    const routes = getMeta(Test, ROUTE_HANDLERS) as any[];

    expect(routes[0]).toMatchObject({ method: "GET", path: "/users" });
  });

  it("Post stores correct method and path", () => {
    @Controller("/")
    class Test {
      @Post("/users")
      createUser() {}
    }

    const routes = getMeta(Test, ROUTE_HANDLERS) as any[];

    expect(routes[0]).toMatchObject({ method: "POST", path: "/users" });
  });

  it("Put stores correct method and path", () => {
    @Controller("/")
    class Test {
      @Put("/users/:id")
      updateUser() {}
    }

    const routes = getMeta(Test, ROUTE_HANDLERS) as any[];

    expect(routes[0]).toMatchObject({ method: "PUT", path: "/users/:id" });
  });

  it("Delete stores correct method and path", () => {
    @Controller("/")
    class Test {
      @Delete("/users/:id")
      deleteUser() {}
    }

    const routes = getMeta(Test, ROUTE_HANDLERS) as any[];

    expect(routes[0]).toMatchObject({ method: "DELETE", path: "/users/:id" });
  });

  it("Patch stores correct method and path", () => {
    @Controller("/")
    class Test {
      @Patch("/users/:id")
      patchUser() {}
    }

    const routes = getMeta(Test, ROUTE_HANDLERS) as any[];

    expect(routes[0]).toMatchObject({ method: "PATCH", path: "/users/:id" });
  });

  it("accumulates multiple routes on same controller", () => {
    @Controller("/")
    class Test {
      @Get("/")
      list() {}

      @Post("/")
      create() {}

      @Put("/:id")
      update() {}
    }

    const routes = getMeta(Test, ROUTE_HANDLERS) as any[];

    expect(routes).toHaveLength(3);
  });
});
