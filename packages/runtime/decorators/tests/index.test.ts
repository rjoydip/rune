import { describe, it, expect } from "bun:test";
import * as Decorators from "../src/index";

describe("decorators exports", () => {
  it("exports all decorators", () => {
    expect(Decorators.Controller).toBeTypeOf("function");
    expect(Decorators.Get).toBeTypeOf("function");
    expect(Decorators.Post).toBeTypeOf("function");
    expect(Decorators.Put).toBeTypeOf("function");
    expect(Decorators.Delete).toBeTypeOf("function");
    expect(Decorators.Patch).toBeTypeOf("function");
    expect(Decorators.Body).toBeTypeOf("function");
    expect(Decorators.Param).toBeTypeOf("function");
    expect(Decorators.Query).toBeTypeOf("function");
    expect(Decorators.Headers).toBeTypeOf("function");
    expect(Decorators.Req).toBeTypeOf("function");
    expect(Decorators.UseGuard).toBeTypeOf("function");
    expect(Decorators.UseInterceptor).toBeTypeOf("function");
    expect(Decorators.Module).toBeTypeOf("function");
    expect(Decorators.Injectable).toBeTypeOf("function");
  });

  it("exports metadata constants", () => {
    expect(Decorators.ROUTE_HANDLERS).toBe("rune:route-handlers");
    expect(Decorators.CONTROLLER_PREFIX).toBe("rune:controller-prefix");
    expect(Decorators.MODULE_METADATA).toBe("rune:module-metadata");
    expect(Decorators.INJECTABLE_SCOPE).toBe("rune:injectable-scope");
    expect(Decorators.GUARD_METADATA).toBe("rune:guards");
    expect(Decorators.INTERCEPTOR_METADATA).toBe("rune:interceptors");
    expect(Decorators.PARAM_METADATA).toBe("rune:param-metadata");
    expect(Decorators.DTO_METADATA).toBe("rune:dto-metadata");
  });
});
