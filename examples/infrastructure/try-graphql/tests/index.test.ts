import { describe, it, expect } from "bun:test";
import app from "../index";

describe("try-graphql", () => {
  it("responds to REST endpoint", async () => {
    const res = await app.fetch(new Request("http://localhost/graphql/hello"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ message: "REST endpoint works too" });
  });

  it("responds to GraphQL POST query", async () => {
    const res = await app.fetch(
      new Request("http://localhost/graphql", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ query: "{ hello }" }),
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toEqual({ hello: "Hello from GraphQL!" });
  });

  it("responds to GraphQL mutation", async () => {
    const res = await app.fetch(
      new Request("http://localhost/graphql", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          query: "mutation ($msg: String!) { echo(message: $msg) }",
          variables: { msg: "test" },
        }),
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toEqual({ echo: "test" });
  });

  it("returns 404 for unknown route", async () => {
    const res = await app.fetch(new Request("http://localhost/unknown"));
    expect(res.status).toBe(404);
  });
});
