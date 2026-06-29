const SWAGGER_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Rune API Docs</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css" />
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    SwaggerUIBundle({ url: "/openapi.json", dom_id: "#swagger-ui" });
  </script>
</body>
</html>`;

/**
 * Returns the HTML string for the Swagger UI documentation page.
 * The HTML loads Swagger UI from CDN and points to `/openapi.json` as the spec source.
 * @returns A complete HTML document string for rendering Swagger UI.
 *
 * @example
 * ```ts
 * import { getSwaggerHTML } from "@rune/openapi";
 * const html = getSwaggerHTML();
 * ```
 */
export function getSwaggerHTML(): string {
  return SWAGGER_HTML;
}
