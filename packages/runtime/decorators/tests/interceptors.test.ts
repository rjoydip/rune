import { describe, it, expect } from "bun:test";

import { UseInterceptor, getMeta } from "../src/index";

import { INTERCEPTOR_METADATA } from "../src/metadata";

describe("UseInterceptor", () => {
  it("stores interceptors at class level", () => {
    class LoggingInterceptor {}

    @UseInterceptor(LoggingInterceptor)
    class Test {}

    const interceptors = getMeta(Test, INTERCEPTOR_METADATA);

    expect(interceptors).toEqual([LoggingInterceptor]);
  });

  it("stores interceptors at method level", () => {
    class CacheInterceptor {}

    class Test {
      @UseInterceptor(CacheInterceptor)
      get() {}
    }

    const interceptors = getMeta(Test.prototype.get, INTERCEPTOR_METADATA);

    expect(interceptors).toEqual([CacheInterceptor]);
  });

  it("stores multiple interceptors", () => {
    class A {}

    class B {}

    @UseInterceptor(A, B)
    class Test {}

    const interceptors = getMeta(Test, INTERCEPTOR_METADATA);

    expect(interceptors).toEqual([A, B]);
  });
});
