import { describe, it, expect } from "bun:test";

import { Injectable, getMeta } from "../src/index";

import { INJECTABLE_SCOPE } from "../src/metadata";

describe("Injectable", () => {
  it("defaults to singleton scope", () => {
    @Injectable()
    class Service {}

    const meta = getMeta(Service, INJECTABLE_SCOPE);

    expect(meta).toEqual({ scope: "singleton" });
  });

  it("sets transient scope", () => {
    @Injectable("transient")
    class Service {}

    const meta = getMeta(Service, INJECTABLE_SCOPE);

    expect(meta).toEqual({ scope: "transient" });
  });

  it("sets request scope", () => {
    @Injectable("request")
    class Service {}

    const meta = getMeta(Service, INJECTABLE_SCOPE);

    expect(meta).toEqual({ scope: "request" });
  });
});
