import type { Context, Middleware, NextFunction } from "@rune/core";

/**
 * Options for configuring the Content-Security-Policy header.
 * Each directive is an array of allowed values.
 *
 * @param defaultSrc - Default source directive (default-src).
 * @param baseUri - Allowed base URIs (base-uri).
 * @param childSrc - Allowed child sources (child-src).
 * @param connectSrc - Allowed fetch/connect sources (connect-src).
 * @param fontSrc - Allowed font sources (font-src).
 * @param formAction - Allowed form action targets (form-action).
 * @param frameAncestors - Allowed frame ancestors (frame-ancestors).
 * @param frameSrc - Allowed frame sources (frame-src).
 * @param imgSrc - Allowed image sources (img-src).
 * @param manifestSrc - Allowed manifest sources (manifest-src).
 * @param mediaSrc - Allowed media sources (media-src).
 * @param objectSrc - Allowed object sources (object-src).
 * @param scriptSrc - Allowed script sources (script-src).
 * @param scriptSrcAttr - Allowed inline script attribute sources (script-src-attr).
 * @param scriptSrcElem - Allowed script element sources (script-src-elem).
 * @param styleSrc - Allowed style sources (style-src).
 * @param styleSrcAttr - Allowed inline style attribute sources (style-src-attr).
 * @param styleSrcElem - Allowed style element sources (style-src-elem).
 * @param upgradeInsecureRequests - Whether to upgrade HTTP requests to HTTPS.
 * @param workerSrc - Allowed worker sources (worker-src).
 *
 * @example
 * ```ts
 * const csp: ContentSecurityPolicyOptions = {
 *   defaultSrc: ["'self'"],
 *   scriptSrc: ["'self'", "https://cdn.example.com"],
 * };
 * ```
 */
export type ContentSecurityPolicyOptions = {
  defaultSrc?: string[];
  baseUri?: string[];
  childSrc?: string[];
  connectSrc?: string[];
  fontSrc?: string[];
  formAction?: string[];
  frameAncestors?: string[];
  frameSrc?: string[];
  imgSrc?: string[];
  manifestSrc?: string[];
  mediaSrc?: string[];
  objectSrc?: string[];
  scriptSrc?: string[];
  scriptSrcAttr?: string[];
  scriptSrcElem?: string[];
  styleSrc?: string[];
  styleSrcAttr?: string[];
  styleSrcElem?: string[];
  upgradeInsecureRequests?: boolean;
  workerSrc?: string[];
};

type OverridableHeader = boolean | string;

/**
 * Options for configuring secure HTTP response headers.
 *
 * @param contentSecurityPolicy - Content-Security-Policy configuration.
 * @param crossOriginEmbedderPolicy - Cross-Origin-Embedder-Policy header value or boolean (default false).
 * @param crossOriginResourcePolicy - Cross-Origin-Resource-Policy header value or boolean (default true -> "same-origin").
 * @param crossOriginOpenerPolicy - Cross-Origin-Opener-Policy header value or boolean (default true -> "same-origin").
 * @param referrerPolicy - Referrer-Policy header value or boolean (default true -> "no-referrer").
 * @param strictTransportSecurity - Strict-Transport-Security header value or boolean (default true).
 * @param xContentTypeOptions - X-Content-Type-Options header value or boolean (default true -> "nosniff").
 * @param xFrameOptions - X-Frame-Options header value or boolean (default true -> "SAMEORIGIN").
 * @param xXssProtection - X-XSS-Protection header value or boolean (default true -> "0").
 * @param removePoweredBy - Whether to remove the X-Powered-By header (default true).
 * @param permissionsPolicy - Permissions-Policy directives as key/value pairs.
 *
 * @example
 * ```ts
 * import { secureHeaders } from "@rune/middleware";
 * app.use(secureHeaders({
 *   contentSecurityPolicy: { defaultSrc: ["'self'"] },
 *   strictTransportSecurity: "max-age=31536000",
 * }));
 * ```
 */
export type SecureHeadersOptions = {
  contentSecurityPolicy?: ContentSecurityPolicyOptions;
  crossOriginEmbedderPolicy?: OverridableHeader;
  crossOriginResourcePolicy?: OverridableHeader;
  crossOriginOpenerPolicy?: OverridableHeader;
  referrerPolicy?: OverridableHeader;
  strictTransportSecurity?: OverridableHeader;
  xContentTypeOptions?: OverridableHeader;
  xFrameOptions?: OverridableHeader;
  xXssProtection?: OverridableHeader;
  removePoweredBy?: boolean;
  permissionsPolicy?: Record<string, string[]>;
};

const DEFAULT_HEADERS: Record<string, [string, string]> = {
  crossOriginEmbedderPolicy: ["Cross-Origin-Embedder-Policy", "require-corp"],
  crossOriginResourcePolicy: ["Cross-Origin-Resource-Policy", "same-origin"],
  crossOriginOpenerPolicy: ["Cross-Origin-Opener-Policy", "same-origin"],
  referrerPolicy: ["Referrer-Policy", "no-referrer"],
  strictTransportSecurity: ["Strict-Transport-Security", "max-age=15552000; includeSubDomains"],
  xContentTypeOptions: ["X-Content-Type-Options", "nosniff"],
  xFrameOptions: ["X-Frame-Options", "SAMEORIGIN"],
  xXssProtection: ["X-XSS-Protection", "0"],
};

const DEFAULT_OPTIONS: SecureHeadersOptions = {
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: true,
  crossOriginOpenerPolicy: true,
  referrerPolicy: true,
  strictTransportSecurity: true,
  xContentTypeOptions: true,
  xFrameOptions: true,
  xXssProtection: true,
  removePoweredBy: true,
};

function directiveToKebab(key: string): string {
  return key.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
}

function buildCSP(options: ContentSecurityPolicyOptions): string {
  return Object.entries(options)
    .filter(([, value]) => value !== undefined && (typeof value === "boolean" || value.length > 0))
    .map(([key, value]) => {
      if (key === "upgradeInsecureRequests" && value === true) {
        return "upgrade-insecure-requests";
      }
      const kebab = directiveToKebab(key);
      const values = Array.isArray(value) ? value.join(" ") : value;
      return `${kebab} ${values}`;
    })
    .join("; ");
}

/**
 * Middleware that sets secure HTTP response headers including
 * Content-Security-Policy, Strict-Transport-Security, X-Frame-Options,
 * and other security-related headers with sensible defaults.
 *
 * @param options - Secure headers configuration.
 * @returns A middleware function that adds security headers to responses.
 *
 * @example
 * ```ts
 * import { secureHeaders } from "@rune/middleware";
 * app.use(secureHeaders({
 *   contentSecurityPolicy: {
 *     defaultSrc: ["'self'"],
 *     scriptSrc: ["'self'", "https://cdn.example.com"],
 *   },
 * }));
 * ```
 */
export function secureHeaders(options: SecureHeadersOptions = {}): Middleware {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  const headersToSet: [string, string][] = [];

  for (const [key, [header, value]] of Object.entries(DEFAULT_HEADERS)) {
    const opt = opts[key as keyof SecureHeadersOptions];
    if (typeof opt === "string") {
      headersToSet.push([header, opt]);
    } else if (opt === true) {
      headersToSet.push([header, value]);
    }
  }

  if (opts.contentSecurityPolicy) {
    headersToSet.push(["Content-Security-Policy", buildCSP(opts.contentSecurityPolicy)]);
  }

  if (opts.permissionsPolicy && Object.keys(opts.permissionsPolicy).length > 0) {
    const directives = Object.entries(opts.permissionsPolicy)
      .map(([key, value]) => {
        const kebab = directiveToKebab(key);
        if (!Array.isArray(value)) return `${kebab}=none`;
        if (value.length === 0) return `${kebab}=()`;
        if (value.length === 1 && (value[0] === "*" || value[0] === "none")) {
          return `${kebab}=${value[0]}`;
        }
        return `${kebab}=(${value.map((v) => (v === "self" || v === "src" ? v : `"${v}"`)).join(" ")})`;
      })
      .join(", ");
    headersToSet.push(["Permissions-Policy", directives]);
  }

  return async (ctx: Context, next: NextFunction): Promise<Response | void> => {
    await next();

    if (!ctx.response) return;

    for (const [header, value] of headersToSet) {
      ctx.response.headers.set(header, value);
    }

    if (opts.removePoweredBy) {
      ctx.response.headers.delete("X-Powered-By");
    }
  };
}
