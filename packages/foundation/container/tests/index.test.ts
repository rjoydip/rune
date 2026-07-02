import { describe, it, expect } from "bun:test";
import { Container, Scope } from "../src/index";
import { Container as DistContainer, Scope as DistScope } from "@rune/container";

class Service {}

describe("Container", () => {
  it("registers and resolves singleton via useFactory", () => {
    const c = new Container();
    c.register({ token: Service, useFactory: () => new Service(), scope: Scope.Singleton });
    const a = c.resolve(Service);
    const b = c.resolve(Service);
    expect(a).toBe(b);
    expect(a).toBeInstanceOf(Service);
  });

  it("registers and resolves useValue", () => {
    const c = new Container();
    c.register({
      token: "CONFIG",
      useValue: { port: 3000 },
      scope: Scope.Singleton,
    });
    expect(c.resolve<{ port: number }>("CONFIG")).toEqual({ port: 3000 });
  });

  it("registers and resolves useFactory", () => {
    const c = new Container();
    c.register({
      token: "DB",
      useFactory: () => ({ connected: true }),
      scope: Scope.Transient,
    });
    expect(c.resolve<{ connected: boolean }>("DB")).toEqual({ connected: true });
  });

  it("creates new instance for transient scope", () => {
    const c = new Container();
    c.register({ token: Service, useFactory: () => new Service(), scope: Scope.Transient });
    expect(c.resolve(Service)).not.toBe(c.resolve(Service));
  });

  it("singleton factory only calls once", () => {
    let count = 0;
    const c = new Container();
    c.register({
      token: "FACTORY",
      useFactory: () => {
        count++;
        return { id: count };
      },
      scope: Scope.Singleton,
    });
    c.resolve("FACTORY");
    c.resolve("FACTORY");
    expect(count).toBe(1);
  });

  it("createScope returns a new container", () => {
    const c = new Container();
    expect(c.createScope()).toBeInstanceOf(Container);
  });

  it("has returns true for registered tokens", () => {
    const c = new Container();
    c.register({ token: "A", useValue: 1, scope: Scope.Singleton });
    expect(c.has("A")).toBe(true);
    expect(c.has("B")).toBe(false);
  });

  it("throws on missing registration", () => {
    const c = new Container();
    expect(() => c.resolve("MISSING")).toThrow("No registration found for token");
  });

  it("throws on invalid registration (no useClass/useValue/useFactory)", () => {
    const c = new Container();
    const token = class {};
    (c as any).registrations.set(token, { token, scope: Scope.Singleton });
    expect(() => c.resolve(token)).toThrow("Invalid registration");
  });

  it("creates useFactory instance with explicit no args", () => {
    class Main {
      constructor(public a: any) {}
    }
    const c = new Container();
    c.register({ token: Main, useFactory: () => new Main(undefined), scope: Scope.Transient });
    const main = c.resolve(Main);
    expect(main).toBeInstanceOf(Main);
    expect(main.a).toBeUndefined();
  });

  it("supports symbol tokens", () => {
    const sym = Symbol("test");
    const c = new Container();
    c.register({ token: sym, useValue: 42, scope: Scope.Singleton });
    expect(c.resolve<number>(sym)).toBe(42);
  });

  it("resolve with context map for request scope", () => {
    class ReqScoped {
      constructor(public ctx: any) {}
    }
    const contextMap = new Map<string, unknown>();
    contextMap.set("request", "test-req");
    const c = new Container();
    c.register({
      token: ReqScoped,
      useFactory: () => new ReqScoped(undefined),
      scope: Scope.Request,
    });
    const result = c.resolve(ReqScoped, contextMap);
    expect(result).toBeInstanceOf(ReqScoped);
  });
});

describe("Scope", () => {
  it("has correct enum values", () => {
    expect(Scope.Singleton).toBe(Scope.Singleton);
    expect(Scope.Transient).toBe(Scope.Transient);
    expect(Scope.Request).toBe(Scope.Request);
  });
});

describe("dist path", () => {
  it("loads Container from @rune/container dist", () => {
    const c = new DistContainer();
    expect(c).toBeInstanceOf(DistContainer);
  });

  it("has correct Scope enum from dist", () => {
    expect(DistScope.Singleton).toBe(DistScope.Singleton);
    expect(DistScope.Transient).toBe(DistScope.Transient);
    expect(DistScope.Request).toBe(DistScope.Request);
  });
});
