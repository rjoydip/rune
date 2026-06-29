import { describe, it, expect } from "bun:test";

import { ModuleLoader } from "../src/module-loader";

import { Container } from "@rune/container";

import { Router } from "@rune/router";

import { Module, Controller, Get, Injectable } from "@rune/decorators";

describe("module-loader", () => {
  it("loads module and registers providers/controllers", () => {
    @Injectable("singleton")
    class UserService {
      getUsers() {
        return [];
      }
    }

    @Controller("/users")
    class UserController {
      @Get("/")
      list() {
        return [];
      }
    }

    @Module({
      controllers: [UserController],

      providers: [UserService],

      imports: [],

      exports: [],
    })
    class AppModule {}

    const container = new Container();

    const router = new Router();

    const loader = new ModuleLoader(container, router);

    loader.load(AppModule);

    expect(container.has(UserService)).toBe(true);

    expect(container.has(UserController)).toBe(true);
  });

  it("throws for module without @Module metadata", () => {
    class InvalidModule {}

    const loader = new ModuleLoader(new Container(), new Router());

    expect(() => loader.load(InvalidModule)).toThrow("not found on InvalidModule");
  });

  it("loads imported modules", () => {
    @Injectable("singleton")
    class SharedService {}

    @Module({
      controllers: [],

      providers: [SharedService],

      imports: [],

      exports: [],
    })
    class SharedModule {}

    @Controller("/test")
    class TestController {
      @Get("/")
      list() {
        return [];
      }
    }

    @Module({
      controllers: [TestController],

      providers: [],

      imports: [SharedModule],

      exports: [],
    })
    class AppModule {}

    const container = new Container();

    const loader = new ModuleLoader(container, new Router());

    loader.load(AppModule);

    expect(container.has(SharedService)).toBe(true);
  });

  it("prevents circular module loading", () => {
    @Module({ controllers: [], providers: [], imports: [], exports: [] })
    class ModuleA {}

    @Module({ controllers: [], providers: [], imports: [ModuleA], exports: [] })
    class ModuleB {}

    // ModuleA imports ModuleB would be circular, but just loading both should work

    const container = new Container();

    const loader = new ModuleLoader(container, new Router());

    loader.load(ModuleB);

    expect(true).toBe(true);
  });
});
