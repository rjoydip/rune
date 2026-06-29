/**
 * Re-exports from the OpenAPI scanner module.
 */
export { OpenAPIScanner } from "./scanner.ts";

/**
 * Re-exports the Swagger UI HTML generator.
 */
export { getSwaggerHTML } from "./swagger-ui.ts";

/**
 * Re-exports core OpenAPI type definitions from the scanner module.
 */
export type {
  OpenAPISpec,
  OpenAPIRoute,
  OpenAPIParameter,
  OpenAPIRequestBody,
  OpenAPIResponse,
} from "./scanner.ts";
