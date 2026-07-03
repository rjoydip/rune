import type { Context, Middleware, NextFunction } from "@rune/core";
import { timingSafeEqual } from "./helpers.js";

/**
 * Options for configuring HTTP Basic Authentication.
 *
 * @param username - The expected username for authentication.
 * @param password - The expected password for authentication.
 * @param realm - The authentication realm displayed in the WWW-Authenticate header (default "Secure Area").
 * @param invalidUserMessage - Custom message or function returning a message when credentials are invalid.
 * @param onAuthSuccess - Optional callback invoked after successful authentication.
 *
 * @example
 * ```ts
 * import { basicAuth } from "@rune/middleware";
 * app.use(basicAuth({
 *   username: "admin",
 *   password: "s3cr3t",
 *   realm: "Admin Panel",
 * }));
 * ```
 */
export type BasicAuthOptions = {
  username: string;
  password: string;
  realm?: string;
  invalidUserMessage?:
    | string
    | object
    | ((c: Context) => string | object | Promise<string | object>);
  onAuthSuccess?: (c: Context, username: string) => void | Promise<void>;
};

function decodeBase64(encoded: string): string {
  return Buffer.from(encoded, "base64").toString("utf-8");
}

function parseBasicAuth(header: string): { username: string; password: string } | null {
  const parts = header.split(" ");
  if (parts.length !== 2 || parts[0] !== "Basic") return null;
  const decoded = decodeBase64(parts[1]);
  const colon = decoded.indexOf(":");
  if (colon === -1) return null;
  return { username: decoded.slice(0, colon), password: decoded.slice(colon + 1) };
}

/**
 * Middleware that enforces HTTP Basic Authentication.
 * Validates credentials using timing-safe comparison.
 *
 * @param options - Configuration options including username, password, and realm.
 * @returns A middleware function that returns 401 if authentication fails.
 *
 * @example
 * ```ts
 * import { basicAuth } from "@rune/middleware";
 * app.use(basicAuth({ username: "admin", password: "secret" }));
 * ```
 */
export function basicAuth(options: BasicAuthOptions): Middleware {
  const realm = options.realm ?? "Secure Area";
  const invalidUserMessage = options.invalidUserMessage ?? "Unauthorized";

  return async (ctx: Context, next: NextFunction): Promise<Response | void> => {
    const authHeader = ctx.headers.get("authorization");
    if (authHeader) {
      const credentials = parseBasicAuth(authHeader);
      if (credentials) {
        const usernameOk = timingSafeEqual(credentials.username, options.username);
        const passwordOk = timingSafeEqual(credentials.password, options.password);
        if (usernameOk && passwordOk) {
          if (options.onAuthSuccess) {
            await options.onAuthSuccess(ctx, credentials.username);
          }
          return next();
        }
      }
    }

    const message =
      typeof invalidUserMessage === "function" ? await invalidUserMessage(ctx) : invalidUserMessage;

    const headers: Record<string, string> = {
      "WWW-Authenticate": `Basic realm="${realm.replace(/"/g, '\\"')}"`,
    };

    if (typeof message === "string") {
      return new Response(message, { status: 401, headers });
    }
    return new Response(JSON.stringify(message), {
      status: 401,
      headers: { ...headers, "content-type": "application/json" },
    });
  };
}
