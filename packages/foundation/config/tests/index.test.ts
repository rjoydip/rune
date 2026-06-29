import { describe, it, expect } from "bun:test";
import { ConfigLoader } from "../src/index";

describe("config exports", () => {
  it("exports ConfigLoader", () => {
    expect(ConfigLoader).toBeDefined();
  });
});
