import { describe, it, expect } from "bun:test";

import { UseGuard, getMeta } from "../src/index";

import { GUARD_METADATA } from "../src/metadata";

describe("UseGuard", () => {
  it("stores guards at class level", () => {
    class AuthGuard {}

    @UseGuard(AuthGuard)
    class Test {}

    const guards = getMeta(Test, GUARD_METADATA);

    expect(guards).toEqual([AuthGuard]);
  });

  it("stores guards at method level", () => {
    class AdminGuard {}

    class Test {
      @UseGuard(AdminGuard)
      delete() {}
    }

    const guards = getMeta(Test.prototype.delete, GUARD_METADATA);

    expect(guards).toEqual([AdminGuard]);
  });

  it("stores multiple guards", () => {
    class A {}

    class B {}

    @UseGuard(A, B)
    class Test {}

    const guards = getMeta(Test, GUARD_METADATA);

    expect(guards).toEqual([A, B]);
  });
});
