import { describe, it, expect } from "bun:test";
import { GraphQLHandler } from "../src/index";

describe("@rune/graphql exports", () => {
  it("exports GraphQLHandler", () => {
    expect(GraphQLHandler).toBeDefined();
    expect(GraphQLHandler).toBeTypeOf("function");
  });
});
