/**
 * Middleware that enforces HTTP Basic Authentication.
 *
 * @example
 * ```ts
 * import { basicAuth } from "@rune/middleware";
 * app.use(basicAuth({ username: "admin", password: "secret" }));
 * ```
 */
export { basicAuth } from "./basic-auth.ts";

/**
 * Options for the basicAuth middleware.
 *
 * @example
 * ```ts
 * import type { BasicAuthOptions } from "@rune/middleware";
 * const opts: BasicAuthOptions = { username: "admin", password: "secret" };
 * ```
 */
export type { BasicAuthOptions } from "./basic-auth.ts";

/**
 * Middleware that enforces Bearer token authentication.
 *
 * @example
 * ```ts
 * import { bearerAuth } from "@rune/middleware";
 * app.use(bearerAuth({ token: "my-secret-token" }));
 * ```
 */
export { bearerAuth } from "./bearer-auth.ts";

/**
 * Options for the bearerAuth middleware.
 *
 * @example
 * ```ts
 * import type { BearerAuthOptions } from "@rune/middleware";
 * const opts: BearerAuthOptions = { token: ["token1", "token2"] };
 * ```
 */
export type { BearerAuthOptions } from "./bearer-auth.ts";

/**
 * Middleware that adds CORS headers to responses.
 *
 * @example
 * ```ts
 * import { cors } from "@rune/middleware";
 * app.use(cors({ origin: "https://example.com" }));
 * ```
 */
export { cors } from "./cors.ts";

/**
 * Options for the cors middleware.
 *
 * @example
 * ```ts
 * import type { CORSOptions } from "@rune/middleware";
 * const opts: CORSOptions = { origin: "*", credentials: true };
 * ```
 */
export type { CORSOptions } from "./cors.ts";

/**
 * Middleware that sets secure HTTP response headers.
 *
 * @example
 * ```ts
 * import { secureHeaders } from "@rune/middleware";
 * app.use(secureHeaders());
 * ```
 */
export { secureHeaders } from "./secure-headers.ts";

/**
 * Options for the secureHeaders middleware, including CSP configuration.
 *
 * @example
 * ```ts
 * import type { SecureHeadersOptions, ContentSecurityPolicyOptions } from "@rune/middleware";
 * const csp: ContentSecurityPolicyOptions = { defaultSrc: ["'self'"] };
 * const opts: SecureHeadersOptions = { contentSecurityPolicy: csp };
 * ```
 */
export type { SecureHeadersOptions, ContentSecurityPolicyOptions } from "./secure-headers.ts";

/**
 * Middleware that assigns a unique ID to each request.
 *
 * @example
 * ```ts
 * import { requestId } from "@rune/middleware";
 * app.use(requestId({ headerName: "X-Request-Id" }));
 * ```
 */
export { requestId } from "./request-id.ts";

/**
 * Options for the requestId middleware.
 *
 * @example
 * ```ts
 * import type { RequestIdOptions } from "@rune/middleware";
 * const opts: RequestIdOptions = { headerName: "X-Trace-Id" };
 * ```
 */
export type { RequestIdOptions } from "./request-id.ts";

/**
 * Middleware that logs incoming requests and outgoing responses.
 *
 * @example
 * ```ts
 * import { logger } from "@rune/middleware";
 * app.use(logger());
 * ```
 */
export { logger } from "./logger.ts";

/**
 * Middleware that adds ETag headers for HTTP caching.
 *
 * @example
 * ```ts
 * import { etag } from "@rune/middleware";
 * app.use(etag({ weak: true }));
 * ```
 */
export { etag } from "./etag.ts";

/**
 * Options for the etag middleware.
 *
 * @example
 * ```ts
 * import type { ETagOptions } from "@rune/middleware";
 * const opts: ETagOptions = { weak: true };
 * ```
 */
export type { ETagOptions } from "./etag.ts";

/**
 * Middleware that compresses response bodies using gzip or deflate.
 *
 * @example
 * ```ts
 * import { compress } from "@rune/middleware";
 * app.use(compress({ threshold: 2048 }));
 * ```
 */
export { compress } from "./compress.ts";

/**
 * Options for the compress middleware.
 *
 * @example
 * ```ts
 * import type { CompressionOptions } from "@rune/middleware";
 * const opts: CompressionOptions = { encoding: "gzip", threshold: 1024 };
 * ```
 */
export type { CompressionOptions } from "./compress.ts";

/**
 * Middleware that aborts requests exceeding a time limit.
 *
 * @example
 * ```ts
 * import { timeout } from "@rune/middleware";
 * app.use(timeout(5000));
 * ```
 */
export { timeout } from "./timeout.ts";

/**
 * Middleware that sets the X-Powered-By response header.
 *
 * @example
 * ```ts
 * import { poweredBy } from "@rune/middleware";
 * app.use(poweredBy({ serverName: "MyApp" }));
 * ```
 */
export { poweredBy } from "./powered-by.ts";

/**
 * Options for the poweredBy middleware.
 *
 * @example
 * ```ts
 * import type { PoweredByOptions } from "@rune/middleware";
 * const opts: PoweredByOptions = { serverName: "MyApp" };
 * ```
 */
export type { PoweredByOptions } from "./powered-by.ts";

/**
 * Middleware that pretty-prints JSON responses when a query param is present.
 *
 * @example
 * ```ts
 * import { prettyJson } from "@rune/middleware";
 * app.use(prettyJson({ space: 2 }));
 * ```
 */
export { prettyJson } from "./pretty-json.ts";

/**
 * Options for the prettyJson middleware.
 *
 * @example
 * ```ts
 * import type { PrettyJsonOptions } from "@rune/middleware";
 * const opts: PrettyJsonOptions = { space: 4, queryParam: "format" };
 * ```
 */
export type { PrettyJsonOptions } from "./pretty-json.ts";

/**
 * Middleware that trims or appends trailing slashes on URLs.
 *
 * @example
 * ```ts
 * import { trimTrailingSlash, appendTrailingSlash } from "@rune/middleware";
 * app.use(trimTrailingSlash());
 * ```
 */
export { trimTrailingSlash, appendTrailingSlash } from "./trailing-slash.ts";

/**
 * Options for the trimTrailingSlash and appendTrailingSlash middleware.
 *
 * @example
 * ```ts
 * import type { TrimTrailingSlashOptions, AppendTrailingSlashOptions } from "@rune/middleware";
 * const trimOpts: TrimTrailingSlashOptions = { alwaysRedirect: true };
 * const appendOpts: AppendTrailingSlashOptions = { alwaysRedirect: true };
 * ```
 */
export type { TrimTrailingSlashOptions, AppendTrailingSlashOptions } from "./trailing-slash.ts";
