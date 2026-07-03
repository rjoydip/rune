import {
  CONTROLLER_PREFIX,
  ROUTE_HANDLERS,
  MODULE_METADATA,
  getMeta,
  joinPaths,
} from "@rune/decorators";
import type { RouteHandlerMetadata, ModuleMetadata } from "@rune/decorators";

/**
 * Describes a single route entry in the generated OpenAPI spec.
 */
export interface OpenAPIRoute {
  method: string;
  path: string;
  operationId: string;
  summary: string;
  parameters: OpenAPIParameter[];
  requestBody?: OpenAPIRequestBody;
  responses: Record<string, OpenAPIResponse>;
}

/**
 * Describes a path or query parameter in the OpenAPI spec.
 */
export interface OpenAPIParameter {
  name: string;
  in: "path" | "query" | "header";
  required: boolean;
  schema: { type: string };
}

/**
 * Describes a request body in the OpenAPI spec.
 */
export interface OpenAPIRequestBody {
  required: boolean;
  content: Record<string, { schema: Record<string, unknown> }>;
}

/**
 * Describes a response object in the OpenAPI spec.
 */
export interface OpenAPIResponse {
  description: string;
  content?: Record<string, { schema: Record<string, unknown> }>;
}

/**
 * The full OpenAPI 3.0 specification document structure.
 */
export interface OpenAPISpec {
  openapi: string;
  info: { title: string; version: string };
  paths: Record<string, Record<string, unknown>>;
}

/**
 * Scans decorated controllers and modules to auto-generate an OpenAPI 3.0 specification.
 *
 * @example
 * ```ts
 * const scanner = new OpenAPIScanner("My API", "2.0.0");
 * const spec = scanner.scan(AppModule);
 * console.log(JSON.stringify(spec, null, 2));
 * ```
 */
export class OpenAPIScanner {
  private spec: OpenAPISpec;

  /**
   * @param title - The API title (default "Rune API").
   * @param version - The API version (default "1.0.0").
   */
  constructor(title = "Rune API", version = "1.0.0") {
    this.spec = {
      openapi: "3.0.3",
      info: { title, version },
      paths: {},
    };
  }

  /**
   * Scan a root module and all its imports/controllers to build the OpenAPI spec.
   * @param moduleClass - The root module class decorated with @Module.
   * @returns The generated OpenAPISpec.
   *
   * @example
   * ```ts
   * const spec = scanner.scan(AppModule);
   * ```
   */
  scan(moduleClass: new (...args: never[]) => unknown): OpenAPISpec {
    this.scanModule(moduleClass, new Set());
    return this.spec;
  }

  private scanModule(moduleClass: new (...args: never[]) => unknown, visited: Set<unknown>): void {
    if (visited.has(moduleClass)) return;
    visited.add(moduleClass);
    const metadata: ModuleMetadata | undefined = getMeta(moduleClass, MODULE_METADATA) as
      | ModuleMetadata
      | undefined;
    if (!metadata) return;
    for (const importClass of metadata.imports) {
      this.scanModule(importClass as new (...args: never[]) => unknown, visited);
    }
    for (const controller of metadata.controllers) {
      this.scanController(controller as new (...args: never[]) => unknown);
    }
  }

  private scanController(controller: new (...args: never[]) => unknown): void {
    const prefix: string = (getMeta(controller, CONTROLLER_PREFIX) as string) ?? "/";
    const routes: RouteHandlerMetadata[] =
      (getMeta(controller, ROUTE_HANDLERS) as RouteHandlerMetadata[]) ?? [];
    for (const route of routes) {
      const fullPath = joinPaths(prefix, route.path);
      const method = route.method.toLowerCase();
      const params = route.paramMetadata;
      const pathItem = this.spec.paths[fullPath] ?? {};
      const operation: Record<string, unknown> = {
        operationId: `${route.method}_${fullPath.replace(/\//g, "_")}`,
        summary: `${route.method} ${fullPath}`,
        parameters: params
          .filter((p) => p.type !== "body")
          .map((p, i) => ({
            name: `param_${i}`,
            in:
              p.type === "param"
                ? "path"
                : p.type === "query"
                  ? "query"
                  : p.type === "headers"
                    ? "header"
                    : "header",
            required: p.type === "param",
            schema: { type: "string" },
          })),
        responses: {
          "200": { description: "Success" },
        },
      };
      if (params.some((p) => p.type === "body")) {
        operation.requestBody = {
          required: true,
          content: {
            "application/json": {
              schema: { type: "object" },
            },
          },
        };
      }
      pathItem[method] = operation;
      this.spec.paths[fullPath] = pathItem;
    }
  }
}
