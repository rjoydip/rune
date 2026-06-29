import type { GraphQLAdapter, ExecutionResult } from "./adapter.js";

let graphql: typeof import("graphql") | null = null;

async function getGraphql() {
  if (!graphql) {
    graphql = await import("graphql");
  }
  return graphql;
}

function renderGraphiQL(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>GraphiQL</title>
  <style>
    body { margin: 0; }
    #graphiql { height: 100vh; }
  </style>
  <link rel="stylesheet" href="https://unpkg.com/graphiql/graphiql.min.css" />
</head>
<body>
  <div id="graphiql">Loading...</div>
  <script src="https://unpkg.com/graphiql/graphiql.min.js"></script>
  <script>
    const fetcher = graphiql.createFetcher({ url: window.location.pathname });
    ReactDOM.render(React.createElement(graphiql.GraphiQL, { fetcher }), document.getElementById('graphiql'));
  </script>
</body>
</html>`;
}

/**
 * Options for configuring a GraphQLHandler instance.
 */
export interface GraphQLHandlerOptions {
  /** The compiled GraphQL schema object from graphql-js. */
  schema: unknown;
  /** Optional root value passed to all resolvers. */
  rootValue?: unknown;
  /** Enable the GraphiQL IDE at the /graphql endpoint (default: false). */
  graphiql?: boolean;
}

/**
 * GraphQL handler that implements the GraphQLAdapter interface.
 * Uses graphql-js to execute queries and supports GET/POST requests with optional GraphiQL.
 *
 * @example
 * ```ts
 * import { buildSchema } from "graphql";
 * const schema = buildSchema("type Query { hello: String }");
 * const handler = new GraphQLHandler({ schema, graphiql: true });
 * const response = await handler.handleRequest(new Request("http://localhost/graphql", {
 *   method: "POST",
 *   headers: { "content-type": "application/json" },
 *   body: JSON.stringify({ query: "{ hello }" }),
 * }));
 * ```
 */
export class GraphQLHandler implements GraphQLAdapter {
  private schema: unknown;
  private rootValue: unknown;
  private graphiql: boolean;

  /**
   * @param options - Configuration for the handler, including the schema and optional settings.
   */
  constructor(options: GraphQLHandlerOptions) {
    this.schema = options.schema;
    this.rootValue = options.rootValue;
    this.graphiql = options.graphiql ?? false;
  }

  /**
   * Execute a GraphQL query against the schema using graphql-js.
   * @param query - The GraphQL query string.
   * @param variables - Optional variable values for the query.
   * @param contextValue - Optional context value passed to resolvers.
   *
   * @example
   * ```ts
   * const result = await handler.execute(
   *   "query($id: ID!) { user(id: $id) { name } }",
   *   { id: "1" },
   * );
   * ```
   */
  async execute(
    query: string,
    variables?: Record<string, unknown> | null,
    contextValue?: unknown,
  ): Promise<ExecutionResult> {
    const gql = await getGraphql();
    const result = await gql.graphql({
      schema: this.schema as any,
      source: query,
      variableValues: variables ?? undefined,
      rootValue: this.rootValue,
      contextValue,
    });
    return result as unknown as ExecutionResult;
  }

  /**
   * Handle an HTTP request for a GraphQL endpoint.
   * Supports GET (query params), POST (JSON or raw GraphQL body), and renders GraphiQL when enabled.
   * @param request - The incoming HTTP request.
   *
   * @example
   * ```ts
   * const response = await handler.handleRequest(new Request("http://localhost/graphql?query={hello}"));
   * ```
   */
  async handleRequest(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (this.graphiql && request.method === "GET" && url.pathname.endsWith("/graphql")) {
      const accept = request.headers.get("accept") || "";
      if (accept.includes("text/html")) {
        return new Response(renderGraphiQL(), {
          headers: { "content-type": "text/html" },
        });
      }
    }

    let query: string | null = null;
    let variables: Record<string, unknown> | null = null;
    let operationName: string | null = null;

    if (request.method === "GET") {
      query = url.searchParams.get("query");
      const vars = url.searchParams.get("variables");
      if (vars) {
        try {
          variables = JSON.parse(vars);
        } catch {
          return new Response(JSON.stringify({ errors: [{ message: "Invalid variables JSON" }] }), {
            status: 400,
            headers: { "content-type": "application/json" },
          });
        }
      }
      operationName = url.searchParams.get("operationName");
    } else if (request.method === "POST") {
      const contentType = request.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        let body: Record<string, unknown>;
        try {
          body = await request.json();
        } catch {
          return new Response(JSON.stringify({ errors: [{ message: "Invalid JSON body" }] }), {
            status: 400,
            headers: { "content-type": "application/json" },
          });
        }
        query = (body.query as string) ?? null;
        variables = (body.variables as Record<string, unknown>) ?? null;
        operationName = (body.operationName as string) ?? null;
      } else if (contentType.includes("application/graphql")) {
        query = await request.text();
      } else {
        return new Response(JSON.stringify({ errors: [{ message: "Unsupported content type" }] }), {
          status: 400,
          headers: { "content-type": "application/json" },
        });
      }
    } else {
      return new Response(JSON.stringify({ errors: [{ message: "Method not allowed" }] }), {
        status: 405,
        headers: { "content-type": "application/json" },
      });
    }

    if (!query) {
      return new Response(JSON.stringify({ errors: [{ message: "No query provided" }] }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }

    const gql = await getGraphql();
    const result = await gql.graphql({
      schema: this.schema as any,
      source: query,
      variableValues: variables ?? undefined,
      operationName: operationName ?? undefined,
      rootValue: this.rootValue,
    });

    const statusCode = result.errors ? 200 : 200;
    return new Response(JSON.stringify(result), {
      status: statusCode,
      headers: { "content-type": "application/json" },
    });
  }
}
