import type { RuneApp } from "@rune/core";

/**
 * Minimal shape of a Fastify-compatible request needed by this adapter.
 */
interface FastifyRequest {
  protocol: string;
  hostname: string;
  url: string;
  method: string;
  headers: Record<string, string | string[] | undefined>;
  body: unknown;
}

/**
 * Minimal shape of a Fastify-compatible reply needed by this adapter.
 */
interface FastifyReply {
  status(code: number): this;
  header(key: string, value: string): this;
  send(body: string): this;
}

/**
 * Minimal shape of a Fastify-compatible instance needed by this adapter.
 * Using a structural interface avoids locking to a specific fastify version.
 */
interface FastifyApp {
  all(path: string, handler: (req: FastifyRequest, reply: FastifyReply) => Promise<unknown>): void;
}

/**
 * Attaches a Rune application to a Fastify-compatible server.
 * All routes are captured via `*` wildcard and forwarded to the Rune request pipeline.
 * @param app - The Rune application instance.
 * @param fastify - A Fastify-compatible instance.
 * @returns The same Fastify instance with the Rune handler registered.
 *
 * @example
 * ```ts
 * import { toFastify } from "@rune/adapter-fastify";
 * import { createApp } from "@rune/core";
 * import Fastify from "fastify";
 *
 * const app = createApp();
 * const fastify = toFastify(app, Fastify());
 * await fastify.listen({ port: 3000 });
 * ```
 */
export function toFastify<T extends FastifyApp>(app: RuneApp, fastify: T): T {
  fastify.all("*", async (req: FastifyRequest, reply: FastifyReply) => {
    const url = `${req.protocol}://${req.hostname}${req.url}`;
    const request = new Request(url, {
      method: req.method,
      headers: req.headers as Record<string, string>,
      body: req.method !== "GET" && req.method !== "HEAD" ? JSON.stringify(req.body) : undefined,
    });

    const res = await app.fetch(request);
    reply.status(res.status);

    res.headers.forEach((value, key) => {
      reply.header(key, value);
    });

    const text = await res.text();
    return reply.send(text);
  });

  return fastify;
}
