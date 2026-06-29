import { bench, run } from "bun:test";
import { buildSchema } from "graphql";
import { GraphQLHandler } from "@rune/graphql";

const schema = buildSchema(`
  type Query {
    hello: String
    greet(name: String!): String
    echo(message: String!): String
  }
`);

const rootValue = {
  hello: () => "Hello from GraphQL!",
  greet: ({ name }: { name: string }) => `Hello, ${name}!`,
  echo: ({ message }: { message: string }) => message,
};

const handler = new GraphQLHandler({ schema, rootValue });

bench("GraphQL simple query", async () => {
  await handler.execute("{ hello }");
});

bench("GraphQL query with variable", async () => {
  await handler.execute("query ($msg: String!) { echo(message: $msg) }", { msg: "bench" });
});

bench("GraphQL POST request", async () => {
  const req = new Request("http://localhost/graphql", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ query: "{ hello }" }),
  });
  await handler.handleRequest(req);
});

const iterations = parseInt(process.env.ITERATIONS || "10000", 10);

console.log(`\nRunning GraphQL benchmarks (${iterations.toLocaleString()} iterations each)...\n`);

await run({ iterations });
