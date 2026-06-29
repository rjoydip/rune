import { describe, it, expect } from "bun:test";
import * as Core from "../src/index";

describe("core exports", () => {
  it("exports RuneApp", () => {
    expect(Core.RuneApp).toBeDefined();
  });

  it("exports createApp", () => {
    expect(Core.createApp).toBeTypeOf("function");
  });

  it("exports Context", () => {
    expect(Core.Context).toBeDefined();
  });

  it("exports MiddlewarePipeline", () => {
    expect(Core.MiddlewarePipeline).toBeDefined();
  });

  it("exports ModuleLoader", () => {
    expect(Core.ModuleLoader).toBeDefined();
  });
});
