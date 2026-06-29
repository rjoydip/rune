import { describe, it, expect } from "bun:test";
import app from "../index";

describe("try-core", () => {
  it("responds to GET /hello", async () => {
    const res = await app.fetch(new Request("http://localhost/hello"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ message: "Hello from Rune!" });
  });

  it("responds to POST /echo", async () => {
    const res = await app.fetch(
      new Request("http://localhost/echo", {
        method: "POST",
        headers: { "content-type": "text/plain" },
        body: "hello",
      }),
    );
    expect(res.status).toBe(201);
    expect(await res.text()).toBe("hello");
  });

  it("returns 404 for unknown route", async () => {
    const res = await app.fetch(new Request("http://localhost/unknown"));
    expect(res.status).toBe(404);
  });
});
