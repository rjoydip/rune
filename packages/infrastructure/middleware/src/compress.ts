import type { Context, Middleware, NextFunction } from "@rune/core";

/**
 * Options for configuring response compression.
 *
 * @param encoding - Compression algorithm to use: "gzip" or "deflate". If unset, negotiates with client.
 * @param threshold - Minimum response body size in bytes before compression is applied (default 1024).
 * @param contentTypeFilter - RegExp or function to filter which content types to compress.
 *
 * @example
 * ```ts
 * import { compress } from "@rune/middleware";
 * app.use(compress({ encoding: "gzip", threshold: 2048 }));
 * ```
 */
export type CompressionOptions = {
  encoding?: "gzip" | "deflate";
  threshold?: number;
  contentTypeFilter?: RegExp | ((contentType: string) => boolean);
};

const COMPRESSIBLE_TYPES =
  /^text\/|\+json$|\+xml$|application\/(javascript|json|xml|pdf|postscript|rss|mathml|xhtml|xslt|xop|xslt|wasm|octet-stream)/i;

function shouldTransform(res: Response): boolean {
  const cacheControl = res.headers.get("cache-control");
  return !cacheControl || !/(?:^|,)\s*no-transform\s*(?:,|$)/i.test(cacheControl);
}

function parseAcceptEncoding(header: string): string[] {
  return header
    .split(",")
    .map((s) => s.trim().split(";")[0].trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Middleware that compresses response bodies using gzip or deflate.
 * Compression is only applied when the client advertises support and the
 * response body exceeds the configured threshold.
 *
 * @param options - Compression configuration (encoding, threshold, content type filter).
 * @returns A middleware function that compresses eligible responses.
 *
 * @example
 * ```ts
 * import { compress } from "@rune/middleware";
 * app.use(compress({ threshold: 512 }));
 * ```
 */
export function compress(options: CompressionOptions = {}): Middleware {
  const threshold = options.threshold ?? 1024;
  const encoding = options.encoding;
  const contentTypeFilter = options.contentTypeFilter ?? COMPRESSIBLE_TYPES;

  const shouldCompress =
    typeof contentTypeFilter === "function"
      ? (res: Response) => {
          const type = res.headers.get("content-type");
          return !!type && contentTypeFilter(type);
        }
      : (res: Response) => {
          const type = res.headers.get("content-type");
          return !!type && contentTypeFilter.test(type);
        };

  return async (ctx: Context, next: NextFunction): Promise<Response | void> => {
    await next();

    if (!ctx.response) return;

    const contentLength = ctx.response.headers.get("content-length");

    if (
      ctx.response.headers.has("content-encoding") ||
      ctx.response.headers.has("transfer-encoding") ||
      ctx.request.method === "HEAD" ||
      (contentLength && Number(contentLength) < threshold) ||
      !shouldCompress(ctx.response) ||
      !shouldTransform(ctx.response) ||
      !ctx.response.body
    ) {
      return;
    }

    const accept = ctx.headers.get("accept-encoding");
    if (!accept) return;

    const accepted = parseAcceptEncoding(accept);

    let selectedEncoding: string | undefined;
    if (encoding) {
      selectedEncoding = accepted.includes(encoding) ? encoding : undefined;
    } else {
      selectedEncoding = accepted.includes("gzip")
        ? "gzip"
        : accepted.includes("deflate")
          ? "deflate"
          : undefined;
    }

    if (!selectedEncoding) return;

    const stream = new CompressionStream(selectedEncoding as "gzip" | "deflate");
    ctx.response = new Response(ctx.response.body.pipeThrough(stream), ctx.response);
    ctx.response.headers.delete("content-length");
    ctx.response.headers.set("content-encoding", selectedEncoding);

    const etag = ctx.response.headers.get("etag");
    if (etag && !etag.startsWith("W/")) {
      ctx.response.headers.set("etag", `W/${etag}`);
    }
  };
}
