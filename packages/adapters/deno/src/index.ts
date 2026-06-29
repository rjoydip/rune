import type { RuneApp } from "@rune/core";

declare var Deno: {
  serve: (options: {
    port: number;
    hostname: string;
    signal?: AbortSignal;
    handler: (request: Request) => Response | Promise<Response>;
    onError?: (error: unknown) => Response | Promise<Response>;
  }) => DenoHttpServer;
};

/**
 * Configuration options for the Deno HTTP server.
 */
export interface DenoServeOptions {
  /** The port to listen on (default 3000). */
  port?: number;
  /** The hostname to bind to (default "0.0.0.0"). */
  hostname?: string;
  /** An optional signal that can be used to gracefully shut down the server. */
  signal?: AbortSignal;
  /** Optional error handler invoked when the Rune app throws. */
  onError?: (error: unknown) => Response | Promise<Response>;
}

/**
 * Represents the running Deno HTTP server with lifecycle controls.
 */
export interface DenoHttpServer {
  /** A promise that resolves when the server finishes. */
  finished: Promise<void>;
  /** Prevents the process from exiting while the server is running. */
  ref(): void;
  /** Allows the process to exit even if the server is still running. */
  unref(): void;
}

/**
 * Creates a Deno HTTP server that delegates all requests to the given Rune application.
 * @param app - The Rune application instance.
 * @param options - Server configuration options.
 * @returns A DenoHttpServer instance for lifecycle management.
 *
 * @example
 * ```ts
 * import { serveDeno } from "@rune/adapter-deno";
 * import { createApp } from "@rune/core";
 *
 * const app = createApp();
 * const server = serveDeno(app, { port: 3000 });
 * await server.finished;
 * ```
 */
export function serveDeno(app: RuneApp, options: DenoServeOptions = {}): DenoHttpServer {
  const { port = 3000, hostname = "0.0.0.0", signal, onError } = options;

  const handler = async (request: Request): Promise<Response> => {
    try {
      return await app.fetch(request);
    } catch (error) {
      if (onError) return onError(error);
      const message = error instanceof Error ? error.message : String(error);
      return new Response(JSON.stringify({ error: message }), {
        status: 500,
        headers: { "content-type": "application/json" },
      });
    }
  };

  const server = Deno.serve({ port, hostname, signal, handler });

  return {
    finished: server.finished,
    ref: () => server.ref(),
    unref: () => server.unref(),
  };
}
