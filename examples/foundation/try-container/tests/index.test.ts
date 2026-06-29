import { describe, it, expect } from "bun:test";
import { Container, Scope } from "@rune/container";

describe("try-container", () => {
  it("registers and resolves a value", () => {
    const container = new Container();
    container.register({ token: "msg", useValue: "Hello", scope: Scope.Singleton });
    const result = container.resolve<string>("msg");
    expect(result).toBe("Hello");
  });

  it("transient factory creates new instances", () => {
    const container = new Container();
    container.register({
      token: "counter",
      useFactory: () => ({ count: Math.random() }),
      scope: Scope.Transient,
    });
    const a = container.resolve<{ count: number }>("counter");
    const b = container.resolve<{ count: number }>("counter");
    expect(a.count).not.toBe(b.count);
  });

  it("singleton scope returns same instance", () => {
    const container = new Container();
    container.register({
      token: "obj",
      useFactory: () => ({ id: Math.random() }),
      scope: Scope.Singleton,
    });
    const a = container.resolve<{ id: number }>("obj");
    const b = container.resolve<{ id: number }>("obj");
    expect(a.id).toBe(b.id);
  });
});
