/**
 * The result of executing a GraphQL operation.
 * Contains the requested data and/or any errors that occurred during execution.
 *
 * @example
 * ```ts
 * const result: ExecutionResult = await adapter.execute("{ user { name } }");
 * if (result.errors) {
 *   console.error(result.errors[0].message);
 * }
 * ```
 */
export interface ExecutionResult {
  /** The successfully resolved data, or null if an error occurred. */
  data?: Record<string, unknown> | null;
  /** An array of GraphQL errors, each with a message and optional location/path info. */
  errors?: Array<{
    message: string;
    locations?: { line: number; column: number }[];
    path?: (string | number)[];
  }>;
}

/**
 * GraphQL adapter interface.
 * Defines the contract for executing GraphQL operations and handling HTTP requests.
 */
export interface GraphQLAdapter {
  /**
   * Execute a GraphQL query against the schema.
   * @param query - The GraphQL query string.
   * @param variables - Optional variable values for the query.
   * @param contextValue - Optional context value passed to resolvers.
   *
   * @example
   * ```ts
   * const result = await adapter.execute(
   *   "query($id: ID!) { user(id: $id) { name } }",
   *   { id: "1" },
   * );
   * ```
   */
  execute(
    query: string,
    variables?: Record<string, unknown> | null,
    contextValue?: unknown,
  ): Promise<ExecutionResult>;

  /**
   * Handle a raw HTTP Request and produce a Response.
   * Parses the body, executes the query, and returns a JSON or GraphiQL response.
   * @param request - The incoming HTTP request.
   *
   * @example
   * ```ts
   * const response = await adapter.handleRequest(new Request("http://localhost/graphql", {
   *   method: "POST",
   *   headers: { "content-type": "application/json" },
   *   body: JSON.stringify({ query: "{ hello }" }),
   * }));
   * ```
   */
  handleRequest(request: Request): Promise<Response>;
}
