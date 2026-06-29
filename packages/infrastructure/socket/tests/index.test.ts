import { describe, it, expect } from "bun:test";
import { SocketHandler } from "../src/index";

describe("@rune/socket exports", () => {
  it("exports SocketHandler", () => {
    expect(SocketHandler).toBeDefined();
    expect(SocketHandler).toBeTypeOf("function");
  });
});
