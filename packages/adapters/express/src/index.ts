import type { RuneApp } from "@rune/core";

/**
 * Minimal shape of an Express-compatible request needed by this adapter.
 */
interface ExpressRequest {
  protocol: string;
  get(field: string): string | undefined;
  originalUrl: string;
  method: string;
  headers: Record<string, string | string[] | undefined>;
  body: unknown;
}

/**
 * Minimal shape of an Express-compatible response needed by this adapter.
 */
interface ExpressResponse {
  status(code: number): this;
  setHeader(key: string, value: string): this;
  send(body: string): this;
}

type NextFn = () => void;

/**
 * Minimal shape of an Express-compatible app needed by this adapter.
 * Using a structural interface avoids locking to a specific @types/express version.
 */
interface ExpressApp {
  all(
    path: string,
    handler: (req: ExpressRequest, res: ExpressResponse, next: NextFn) => Promise<void>,
  ): void;
}

/**
 * Attaches a Rune application to an Express-compatible server.
 * All paths under `/*` are captured and forwarded to the Rune request pipeline.
 * @param app - The Rune application instance.
 * @param expressApp - An Express-compatible application instance.
 * @returns The same Express application instance with the Rune handler registered.
 *
 * @example
 * ```ts
 * import { toExpress } from "@rune/adapter-express";
 * import { createApp } from "@rune/core";
 * import express from "express";
 *
 * const app = createApp();
 * const expressApp = toExpress(app, express());
 * expressApp.listen(3000);
 * ```
 */
export function toExpress<T extends ExpressApp>(app: RuneApp, expressApp: T): T {
  expressApp.all("*", async (req: ExpressRequest, res: ExpressResponse, _next: NextFn) => {
    const protocol = req.protocol;
    const host = req.get("host") ?? "localhost";
    const url = `${protocol}://${host}${req.originalUrl}`;

    let body: BodyInit | undefined;
    if (req.method !== "GET" && req.method !== "HEAD") {
      body = JSON.stringify(req.body);
    }

    const request = new Request(url, {
      method: req.method,
      headers: req.headers as Record<string, string>,
      body,
    });

    const runeRes = await app.fetch(request);
    res.status(runeRes.status);

    runeRes.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });

    const text = await runeRes.text();
    res.send(text);
  });

  return expressApp;
}
