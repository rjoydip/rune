import type { Context, Middleware, NextFunction } from "@rune/core";

/**
 * Options for configuring ETag generation.
 *
 * @param weak - Whether to generate weak ETags (prefix with "W/"). Weak ETags allow semantically equivalent responses to match (default false).
 * @param generateDigest - Custom digest function that takes a Uint8Array and returns a hash as a string or ArrayBuffer.
 *
 * @example
 * ```ts
 * import { etag } from "@rune/middleware";
 * app.use(etag({ weak: true }));
 * ```
 */
export type ETagOptions = {
  weak?: boolean;
  generateDigest?: (body: Uint8Array) => ArrayBuffer | Promise<ArrayBuffer>;
};

const RETAINED_304_HEADERS = [
  "cache-control",
  "content-location",
  "date",
  "etag",
  "expires",
  "vary",
];

async function sha1(body: Uint8Array): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-1", body.buffer as ArrayBuffer);
  const hex = Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return hex;
}

function stripWeak(tag: string): string {
  return tag.replace(/^W\//, "");
}

function etagMatches(tag: string, ifNoneMatch: string | null): boolean {
  if (!ifNoneMatch) return false;
  return ifNoneMatch.split(/,\s*/).some((t) => stripWeak(t) === stripWeak(tag));
}

/**
 * Middleware that generates and validates ETags for response caching.
 * Returns 304 Not Modified when the client sends a matching If-None-Match header.
 *
 * @param options - ETag configuration (weak mode, custom digest generator).
 * @returns A middleware function that adds ETag headers and handles conditional requests.
 *
 * @example
 * ```ts
 * import { etag } from "@rune/middleware";
 * app.use(etag());
 * ```
 */
export function etag(options: ETagOptions = {}): Middleware {
  const weak = options.weak ?? false;
  const generator = options.generateDigest ?? sha1;

  return async (ctx: Context, next: NextFunction): Promise<Response | void> => {
    const ifNoneMatch = ctx.headers.get("if-none-match");

    await next();

    if (!ctx.response) return;

    let etagValue = ctx.response.headers.get("ETag");

    if (!etagValue) {
      const body = await ctx.response.clone().arrayBuffer();
      if (!body.byteLength) return;
      const hash = await generator(new Uint8Array(body));
      const hashStr =
        hash instanceof ArrayBuffer
          ? await sha1(new Uint8Array(hash))
          : typeof hash === "string"
            ? hash
            : await sha1(new Uint8Array(hash as ArrayBuffer));
      etagValue = weak ? `W/"${hashStr}"` : `"${hashStr}"`;
    }

    if (etagMatches(etagValue, ifNoneMatch)) {
      const headers = new Headers();
      headers.set("ETag", etagValue);
      const retained = RETAINED_304_HEADERS.filter((h) => ctx.response!.headers.get(h));
      for (const h of retained) {
        headers.set(h, ctx.response!.headers.get(h)!);
      }
      ctx.response = new Response(null, { status: 304, headers });
    } else {
      ctx.response.headers.set("ETag", etagValue);
    }
  };
}
