import { describe, it, expect } from "bun:test";

import { Module, getMeta } from "../src/index";

import { MODULE_METADATA } from "../src/metadata";

describe("Module", () => {
  it("stores module metadata", () => {
    @Module({
      controllers: [],

      providers: [],

      imports: [],

      exports: [],
    })
    class AppModule {}

    const meta = getMeta(AppModule, MODULE_METADATA) as any;

    expect(meta).toBeDefined();

    expect(meta.controllers).toEqual([]);

    expect(meta.providers).toEqual([]);

    expect(meta.imports).toEqual([]);

    expect(meta.exports).toEqual([]);
  });

  it("stores non-empty metadata", () => {
    class A {}

    class B {}

    class C {}

    class D {}

    @Module({
      controllers: [A],

      providers: [B],

      imports: [C],

      exports: [D],
    })
    class AppModule {}

    const meta = getMeta(AppModule, MODULE_METADATA) as any;

    expect(meta.controllers).toEqual([A]);

    expect(meta.providers).toEqual([B]);

    expect(meta.imports).toEqual([C]);

    expect(meta.exports).toEqual([D]);
  });
});
