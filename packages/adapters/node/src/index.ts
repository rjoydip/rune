import type { RuneApp } from "@rune/core";
import * as http from "http";
import * as https from "https";

function createRequestHandler(app: RuneApp) {
  return async (req: http.IncomingMessage, res: http.ServerResponse): Promise<void> => {
    const chunks: Buffer[] = [];
    for await (const chunk of req) {
      chunks.push(chunk as Buffer);
    }
    const body = Buffer.concat(chunks);

    const encrypted = (req.socket as { encrypted?: boolean }).encrypted;
    const protocol = encrypted ? "https" : "http";
    const host = req.headers.host ?? "localhost";
    const url = `${protocol}://${host}${req.url ?? "/"}`;

    const request = new Request(url, {
      method: req.method ?? "GET",
      headers: req.headers as Record<string, string>,
      body: body.length > 0 ? body : undefined,
    });

    const response = await app.fetch(request);

    res.statusCode = response.status;
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });

    const text = await response.text();
    res.end(text);
  };
}

/**
 * Creates a raw Node.js HTTP server that delegates requests to the given Rune application.
 * @param app - The Rune application instance.
 * @param options - Optional Node.js `http.ServerOptions`.
 * @returns A running `http.Server` instance.
 *
 * @example
 * ```ts
 * import { createNodeServer } from "@rune/adapter-node";
 * import { createApp } from "@rune/core";
 *
 * const app = createApp();
 * const server = createNodeServer(app);
 * server.listen(3000);
 * ```
 */
export function createNodeServer(app: RuneApp, options?: http.ServerOptions): http.Server {
  return http.createServer(options ?? {}, createRequestHandler(app));
}

/**
 * Creates a raw Node.js HTTPS server that delegates requests to the given Rune application.
 * @param app - The Rune application instance.
 * @param options - Optional Node.js `https.ServerOptions`.
 * @returns A running `https.Server` instance.
 *
 * @example
 * ```ts
 * import { createNodeHttpsServer } from "@rune/adapter-node";
 * import { createApp } from "@rune/core";
 * import { readFileSync } from "fs";
 *
 * const app = createApp();
 * const server = createNodeHttpsServer(app, {
 *   key: readFileSync("key.pem"),
 *   cert: readFileSync("cert.pem"),
 * });
 * server.listen(443);
 * ```
 */
export function createNodeHttpsServer(app: RuneApp, options?: https.ServerOptions): https.Server {
  return https.createServer(options ?? {}, createRequestHandler(app));
}
