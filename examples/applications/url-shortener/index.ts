import { createApp, Context, NextFunction } from "@rune/core";
import { Module, Controller, Get, Post, Body, Param, Deps } from "@rune/decorators";
import { MemoryCache } from "@rune/cache";
import { ConsoleLogger } from "@rune/logger";
import { NoopTelemetry } from "@rune/telemetry";

class CreateShortUrlDto {
  url!: string;
  customSlug?: string;
}

class UrlService {
  private urls = new Map<string, any>();
  private clicks = new Map<string, number>();

  async createShortUrl(data: CreateShortUrlDto): Promise<any> {
    const code = data.customSlug || Math.random().toString(36).substring(2, 8);
    if (this.urls.has(code)) {
      throw new Error("Slug already in use");
    }
    const entry = {
      code,
      url: data.url,
      clicks: 0,
      createdAt: new Date().toISOString(),
    };
    this.urls.set(code, entry);
    this.clicks.set(code, 0);
    return entry;
  }

  async getUrl(code: string): Promise<any> {
    const entry = this.urls.get(code);
    if (!entry) return null;
    const count = (this.clicks.get(code) || 0) + 1;
    this.clicks.set(code, count);
    entry.clicks = count;
    return entry;
  }

  async getStats(code: string): Promise<any> {
    const entry = this.urls.get(code);
    if (!entry) return null;
    return { ...entry, clicks: this.clicks.get(code) || 0 };
  }

  async getAllUrls(): Promise<any[]> {
    return Array.from(this.urls.values()).map((entry) => ({
      ...entry,
      clicks: this.clicks.get(entry.code) || 0,
    }));
  }

  clearState(): void {
    this.urls.clear();
    this.clicks.clear();
  }
}

class AuthMiddleware {
  private readonly token = "shortener-secret-token-2024";

  async use(ctx: Context, next: NextFunction): Promise<void> {
    if (!ctx.request.url.includes("/api/")) {
      await next();
      return;
    }
    const authHeader = ctx.request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      ctx.send({ error: "Authentication required" }, 401);
      return;
    }
    const token = authHeader.substring(7);
    if (token !== this.token) {
      ctx.send({ error: "Invalid authentication token" }, 401);
      return;
    }
    ctx.state.set("user", { id: "user-123", role: "admin" });
    await next();
  }
}

@Deps(UrlService, MemoryCache, ConsoleLogger, NoopTelemetry)
@Controller("/api/v1")
class UrlController {
  constructor(
    private urlService: UrlService,
    private cache: MemoryCache,
    private logger: ConsoleLogger,
    private telemetry: NoopTelemetry,
  ) {}

  @Post("/urls")
  @Body(CreateShortUrlDto)
  async createShortUrl(body: CreateShortUrlDto): Promise<Response> {
    const span = this.telemetry.startSpan("createShortUrl", {});
    try {
      const entry = await this.urlService.createShortUrl(body);
      await this.cache.set(`url:${entry.code}`, entry, 300);
      this.logger.info("Short URL created", { code: entry.code, url: entry.url });
      span.setAttribute("url.code", entry.code);
      span.end();
      return new Response(JSON.stringify(entry), {
        status: 201,
        headers: { "content-type": "application/json" },
      });
    } catch (error) {
      span.setStatus({ code: 2, message: error instanceof Error ? error.message : String(error) });
      span.end();
      const message = error instanceof Error ? error.message : String(error);
      return new Response(JSON.stringify({ error: message }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }
  }

  @Get("/urls/:code/stats")
  @Param()
  async getStats(code: string): Promise<Response> {
    const span = this.telemetry.startSpan("getUrlStats", { code });
    try {
      const stats = await this.urlService.getStats(code);
      if (!stats) {
        return new Response("Not Found", { status: 404 });
      }
      span.setAttribute("url.code", code);
      span.end();
      return new Response(JSON.stringify(stats), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    } catch (error) {
      span.setStatus({ code: 2, message: error instanceof Error ? error.message : String(error) });
      span.end();
      throw error;
    }
  }

  @Get("/urls")
  async getAllUrls(): Promise<Response> {
    const span = this.telemetry.startSpan("getAllUrls", {});
    try {
      const urls = await this.urlService.getAllUrls();
      span.setAttribute("url.count", urls.length);
      span.end();
      return new Response(JSON.stringify(urls), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    } catch (error) {
      span.setStatus({ code: 2, message: error instanceof Error ? error.message : String(error) });
      span.end();
      throw error;
    }
  }
}

@Deps(UrlService)
@Controller("")
class RedirectController {
  constructor(private urlService: UrlService) {}

  @Get("/:code")
  @Param()
  async redirect(code: string): Promise<Response> {
    const entry = await this.urlService.getUrl(code);
    if (!entry) {
      return new Response("Not Found", { status: 404 });
    }
    return new Response(null, {
      status: 302,
      headers: { location: entry.url },
    });
  }
}

@Module({
  controllers: [UrlController, RedirectController],
  providers: [AuthMiddleware, UrlService, MemoryCache, ConsoleLogger, NoopTelemetry],
  imports: [],
  exports: [],
})
class UrlShortenerModule {}

const app = createApp();

const authMiddleware = new AuthMiddleware();
app.use(async (ctx: Context, next: NextFunction) => {
  await authMiddleware.use(ctx, next);
});

app.use(async (ctx: Context, next: NextFunction) => {
  console.log(`${ctx.request.method} ${ctx.request.url}`);
  await next();
});

app.use(async (ctx: Context, next: NextFunction) => {
  const start = Date.now();
  await next();
  const duration = Date.now() - start;
  console.log(`Request completed in ${duration}ms`);
});

app.registerModule(UrlShortenerModule);

export function resetState() {
  const urlService = app.container.resolve(UrlService);
  urlService.clearState();
}

export default app;
