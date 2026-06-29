import { describe, it, expect, beforeAll } from "bun:test";
import { buildSchema } from "graphql";
import { GraphQLHandler } from "../src/graphql-handler";

const schema = buildSchema(`
  type Query {
    hello: String
    user(id: ID!): User
    echo(message: String!): String
  }

  type Mutation {
    setMessage(message: String!): String
  }

  type User {
    id: ID
    name: String
  }
`);

const rootValue = {
  hello: () => "Hello from GraphQL!",
  user: ({ id }: { id: string }) => ({ id, name: `User ${id}` }),
  echo: ({ message }: { message: string }) => message,
  setMessage: ({ message }: { message: string }) => message,
};

let handler: GraphQLHandler;

beforeAll(() => {
  handler = new GraphQLHandler({ schema, rootValue });
});

describe("GraphQLHandler.execute", () => {
  it("executes a simple query", async () => {
    const result = await handler.execute("{ hello }");
    expect(result.data).toEqual({ hello: "Hello from GraphQL!" });
    expect(result.errors).toBeUndefined();
  });

  it("executes a query with variables", async () => {
    const result = await handler.execute("query ($id: ID!) { user(id: $id) { id name } }", {
      id: "42",
    });
    expect(result.data).toEqual({ user: { id: "42", name: "User 42" } });
  });

  it("executes a mutation", async () => {
    const result = await handler.execute("mutation ($msg: String!) { setMessage(message: $msg) }", {
      msg: "mutated",
    });
    expect(result.data).toEqual({ setMessage: "mutated" });
  });

  it("returns errors for invalid queries", async () => {
    const result = await handler.execute("{ nonexistent }");
    expect(result.errors).toBeDefined();
    expect(result.errors!.length).toBeGreaterThan(0);
  });
});

describe("GraphQLHandler.handleRequest", () => {
  it("handles POST request with JSON body", async () => {
    const req = new Request("http://localhost/graphql", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ query: "{ hello }" }),
    });
    const res = await handler.handleRequest(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toEqual({ hello: "Hello from GraphQL!" });
  });

  it("handles GET request with query param", async () => {
    const req = new Request("http://localhost/graphql?query={hello}", {
      method: "GET",
    });
    const res = await handler.handleRequest(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toEqual({ hello: "Hello from GraphQL!" });
  });

  it("returns 400 for missing query", async () => {
    const req = new Request("http://localhost/graphql", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({}),
    });
    const res = await handler.handleRequest(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.errors[0].message).toBe("No query provided");
  });

  it("returns 400 for invalid JSON body", async () => {
    const req = new Request("http://localhost/graphql", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "not json",
    });
    const res = await handler.handleRequest(req);
    expect(res.status).toBe(400);
  });

  it("returns 405 for unsupported methods", async () => {
    const req = new Request("http://localhost/graphql", {
      method: "PUT",
    });
    const res = await handler.handleRequest(req);
    expect(res.status).toBe(405);
  });

  it("serves GraphiQL when enabled", async () => {
    const gqlHandler = new GraphQLHandler({ schema, rootValue, graphiql: true });
    const req = new Request("http://localhost/graphql", {
      method: "GET",
      headers: { accept: "text/html" },
    });
    const res = await gqlHandler.handleRequest(req);
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain("GraphiQL");
    expect(res.headers.get("content-type")).toBe("text/html");
  });
});
