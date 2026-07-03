import type { Context, Middleware, NextFunction } from "@rune/core";
import { timingSafeEqual } from "./helpers.js";

/**
 * Options for configuring Bearer token authentication.
 *
 * @param token - A single token string or array of valid token strings.
 * @param realm - The authentication realm displayed in the WWW-Authenticate header.
 * @param invalidTokenMessage - Custom message or function when the token is invalid.
 * @param noHeaderMessage - Custom message or function when no Authorization header is present.
 *
 * @example
 * ```ts
 * import { bearerAuth } from "@rune/middleware";
 * app.use(bearerAuth({ token: "my-api-token" }));
 * ```
 */
export type BearerAuthOptions = {
  token: string | string[];
  realm?: string;
  invalidTokenMessage?:
    | string
    | object
    | ((c: Context) => string | object | Promise<string | object>);
  noHeaderMessage?: string | object | ((c: Context) => string | object | Promise<string | object>);
};

const TOKEN_REGEX = /^[A-Za-z0-9._~+/-]+=*$/;

/**
 * Middleware that enforces Bearer token authentication.
 * Supports single or multiple valid tokens with timing-safe comparison.
 *
 * @param options - Configuration options including token(s) and realm.
 * @returns A middleware function that returns 401 if authentication fails.
 *
 * @example
 * ```ts
 * import { bearerAuth } from "@rune/middleware";
 * app.use(bearerAuth({ token: ["token-a", "token-b"] }));
 * ```
 */
export function bearerAuth(options: BearerAuthOptions): Middleware {
  const realm = options.realm ?? "";
  const tokens = Array.isArray(options.token) ? options.token : [options.token];

  return async (ctx: Context, next: NextFunction): Promise<Response | void> => {
    const authHeader = ctx.headers.get("authorization");
    if (!authHeader) {
      const noHeader = options.noHeaderMessage ?? "Unauthorized";
      const message = typeof noHeader === "function" ? await noHeader(ctx) : noHeader;
      const headers: Record<string, string> = {
        "WWW-Authenticate": `Bearer realm="${realm.replace(/"/g, '\\"')}"`,
      };
      if (typeof message === "string") {
        return new Response(message, { status: 401, headers });
      }
      return new Response(JSON.stringify(message), {
        status: 401,
        headers: { ...headers, "content-type": "application/json" },
      });
    }

    const parts = authHeader.split(" ");
    const tokenValue = parts.length === 2 && parts[0] === "Bearer" ? parts[1] : null;

    if (!tokenValue || !TOKEN_REGEX.test(tokenValue)) {
      const invalid = options.invalidTokenMessage ?? "Bad Request";
      const message = typeof invalid === "function" ? await invalid(ctx) : invalid;
      const headers: Record<string, string> = {
        "WWW-Authenticate": 'Bearer error="invalid_request"',
      };
      if (typeof message === "string") {
        return new Response(message, { status: 400, headers });
      }
      return new Response(JSON.stringify(message), {
        status: 400,
        headers: { ...headers, "content-type": "application/json" },
      });
    }

    let valid = false;
    for (const token of tokens) {
      if (timingSafeEqual(token, tokenValue)) {
        valid = true;
        break;
      }
    }

    if (!valid) {
      const invalid = options.invalidTokenMessage ?? "Unauthorized";
      const message = typeof invalid === "function" ? await invalid(ctx) : invalid;
      const headers: Record<string, string> = {
        "WWW-Authenticate": 'Bearer error="invalid_token"',
      };
      if (typeof message === "string") {
        return new Response(message, { status: 401, headers });
      }
      return new Response(JSON.stringify(message), {
        status: 401,
        headers: { ...headers, "content-type": "application/json" },
      });
    }

    return next();
  };
}
