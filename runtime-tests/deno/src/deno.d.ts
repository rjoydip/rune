declare namespace Deno {
  interface ServeOptions {
    port: number;
    hostname?: string;
    signal?: AbortSignal;
    onError?: (error: unknown) => Response | Promise<Response>;
    onListen?: (params: { hostname: string; port: number }) => void;
  }

  interface ServeHandler {
    (request: Request, info: Deno.ServeHandlerInfo): Response | Promise<Response>;
  }

  interface ServeHandlerInfo {
    remoteAddr: { hostname: string; port: string; transport: string };
  }

  interface Server {
    addr: { hostname: string; port: number; transport: string };
    finished: Promise<void>;
    ref(): void;
    unref(): void;
  }

  function serve(handler: ServeHandler): Server;
  function serve(options: ServeOptions, handler: ServeHandler): Server;
}
