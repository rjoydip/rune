import { createApp, Context, NextFunction } from "@rune/core";
import { Scope } from "@rune/container";
import {
  Module,
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Deps,
} from "@rune/decorators";
import { DrizzleAdapter } from "@rune/database";
import { MemoryCache } from "@rune/cache";
import { ConsoleLogger } from "@rune/logger";
import { NoopTelemetry } from "@rune/telemetry";
import { ValidationPipe } from "@rune/validation";
import { eq, like, and } from "drizzle-orm";
import { postsTable } from "./src/db/schema.js";
import { createDb } from "./src/db/db.js";

const dbAdapter = createDb();

const JSON_HEADERS = { "content-type": "application/json" as const };

class CreatePostDto {
  title!: string;
  content!: string;
  author!: string;
  tags?: string[];
}

class UpdatePostDto {
  title?: string;
  content?: string;
}

@Deps(DrizzleAdapter)
class PostService {
  constructor(private db: DrizzleAdapter<any>) {}

  async createPost(data: CreatePostDto): Promise<any> {
    const id = this.generatePostId();
    const post = {
      id,
      title: data.title,
      content: data.content,
      author: data.author,
      tags: data.tags ? JSON.stringify(data.tags) : null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await this.db.client.insert(postsTable).values(post);
    return { ...post, tags: data.tags ?? [] };
  }

  async getPost(id: string): Promise<any> {
    const row = await this.db.client.select().from(postsTable).where(eq(postsTable.id, id)).get();
    if (!row) return null;
    return { ...row, tags: row.tags ? JSON.parse(row.tags) : [] };
  }

  async getPosts(author?: string, tags?: string): Promise<any[]> {
    const conditions: any[] = [];
    if (author) {
      conditions.push(eq(postsTable.author, author));
    }
    if (tags) {
      const tagArray = tags.split(",");
      const tagConditions = tagArray.map((tag) => like(postsTable.tags, `%"${tag}"%`));
      conditions.push(and(...tagConditions));
    }

    const query = this.db.client.select().from(postsTable);
    if (conditions.length > 0) {
      query.where(and(...conditions));
    }
    const rows = await query.all();
    return rows.map((row: any) => ({
      ...row,
      tags: row.tags ? JSON.parse(row.tags) : [],
    }));
  }

  async deleteAllPosts(): Promise<void> {
    await this.db.client.delete(postsTable);
  }

  async updatePost(id: string, data: UpdatePostDto): Promise<any> {
    const existing = await this.db.client.select().from(postsTable).where(eq(postsTable.id, id)).get();
    if (!existing) {
      throw new Error("Post not found");
    }

    const updates: Record<string, any> = { updatedAt: new Date().toISOString() };
    if (data.title !== undefined) updates.title = data.title;
    if (data.content !== undefined) updates.content = data.content;

    await this.db.client.update(postsTable).set(updates).where(eq(postsTable.id, id)).run();

    const updated = await this.db.client.select().from(postsTable).where(eq(postsTable.id, id)).get();
    return { ...updated, tags: updated.tags ? JSON.parse(updated.tags) : [] };
  }

  async deletePost(id: string): Promise<boolean> {
    const result = await this.db.client.delete(postsTable).where(eq(postsTable.id, id)).run();
    return result.changes > 0;
  }

  private generatePostId(): string {
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}

class AuthMiddleware {
  private readonly token = "secret-token-123";

  async use(
    ctx: Context,
    next: (...args: unknown[]) => Promise<Response | void>,
  ): Promise<Response | void> {
    const authHeader = ctx.request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      ctx.send({ error: "Unauthorized" }, 401);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: JSON_HEADERS,
      });
    }

    const token = authHeader.substring(7);
    if (token !== this.token) {
      ctx.send({ error: "Invalid token" }, 401);
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: JSON_HEADERS,
      });
    }

    return next();
  }
}

@Deps(AuthMiddleware, PostService, MemoryCache, ConsoleLogger, NoopTelemetry, ValidationPipe)
@Controller("/api")
class BlogController {
  constructor(
    private authMiddleware: AuthMiddleware,
    private postService: PostService,
    private cache: MemoryCache,
    private logger: ConsoleLogger,
    private telemetry: NoopTelemetry,
    private validationPipe: ValidationPipe,
  ) {}

  @Post("/posts")
  @Body(CreatePostDto)
  async createPost(body: CreatePostDto): Promise<Response> {
    const span = this.telemetry.startSpan("createPost", { author: body.author });

    try {
      const cacheKey = `posts:${body.author}`;
      const cached = await this.cache.get<any>(cacheKey);

      if (cached) {
        this.logger.info("Returning cached post list");
        return new Response(JSON.stringify(cached), {
          status: 200,
          headers: JSON_HEADERS,
        });
      }

      const post = await this.postService.createPost(body);
      await this.cache.set(cacheKey, [post], 60);

      this.logger.info("Post created", { id: post.id, author: post.author });
      span.setAttribute("post.id", post.id);
      span.end();

      return new Response(JSON.stringify(post), {
        status: 201,
        headers: JSON_HEADERS,
      });
    } catch (error) {
      span.setStatus({ code: 2, message: error instanceof Error ? error.message : String(error) });
      span.end();
      throw error;
    }
  }

  @Get("/posts/:id")
  @Param()
  async getPost(id: string): Promise<Response> {
    const span = this.telemetry.startSpan("getPost", { postId: id });

    try {
      const cacheKey = `post:${id}`;
      let post = await this.cache.get<any>(cacheKey);

      if (!post) {
        post = await this.postService.getPost(id);
        if (!post) {
          return new Response("Not Found", { status: 404 });
        }
        await this.cache.set(cacheKey, post, 300);
        this.logger.info("Post fetched from service and cached", { id });
      } else {
        this.logger.info("Post fetched from cache", { id });
      }

      span.setAttribute("post.id", id);
      span.end();

      return new Response(JSON.stringify(post), {
        status: 200,
        headers: JSON_HEADERS,
      });
    } catch (error) {
      span.setStatus({ code: 2, message: error instanceof Error ? error.message : String(error) });
      span.end();
      throw error;
    }
  }

  @Get("/posts")
  @Query()
  @Query()
  async getPosts(author?: string, tags?: string): Promise<Response> {
    const span = this.telemetry.startSpan("getPosts", { author, tags });

    try {
      const cacheKey = `posts:list:author=${author || "all"}:tags=${tags || "all"}`;
      let posts = await this.cache.get<any[]>(cacheKey);

      if (!posts) {
        posts = await this.postService.getPosts(author, tags);
        await this.cache.set(cacheKey, posts, 60);
        this.logger.info("Posts list fetched from service and cached", { author, tags });
      } else {
        this.logger.info("Posts list fetched from cache", { author, tags });
      }

      span.setAttribute("post.count", posts.length);
      span.end();

      return new Response(JSON.stringify(posts), {
        status: 200,
        headers: JSON_HEADERS,
      });
    } catch (error) {
      span.setStatus({ code: 2, message: error instanceof Error ? error.message : String(error) });
      span.end();
      throw error;
    }
  }

  @Put("/posts/:id")
  @Param()
  @Body(UpdatePostDto)
  async updatePost(id: string, body: UpdatePostDto): Promise<Response> {
    const span = this.telemetry.startSpan("updatePost", { postId: id });

    try {
      const post = await this.postService.updatePost(id, body);

      await this.cache.delete(`post:${id}`);
      await this.cache.delete(`posts:*`);

      this.logger.info("Post updated", { id });
      span.setAttribute("post.id", id);
      span.end();

      return new Response(JSON.stringify(post), {
        status: 200,
        headers: JSON_HEADERS,
      });
    } catch (error) {
      span.setStatus({ code: 2, message: error instanceof Error ? error.message : String(error) });
      span.end();
      throw error;
    }
  }

  @Delete("/posts/:id")
  @Param()
  async deletePost(id: string): Promise<Response> {
    const span = this.telemetry.startSpan("deletePost", { postId: id });

    try {
      const success = await this.postService.deletePost(id);

      await this.cache.delete(`post:${id}`);
      await this.cache.delete(`posts:*`);

      this.logger.info("Post deleted", { id });
      span.setAttribute("post.id", id);
      span.end();

      return new Response(JSON.stringify({ success }), {
        status: 200,
        headers: JSON_HEADERS,
      });
    } catch (error) {
      span.setStatus({ code: 2, message: error instanceof Error ? error.message : String(error) });
      span.end();
      throw error;
    }
  }
}

@Module({
  controllers: [BlogController],
  providers: [
    AuthMiddleware,
    PostService,
    MemoryCache,
    ConsoleLogger,
    NoopTelemetry,
    ValidationPipe,
  ],
  imports: [],
  exports: [],
})
class BlogModule {}

const app = createApp();
app.container.register({
  token: DrizzleAdapter,
  useValue: dbAdapter,
  scope: Scope.Singleton,
});

app.onInit(async () => {
  await dbAdapter.connect();
});

app.onDestroy(async () => {
  await dbAdapter.disconnect();
});

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

app.registerModule(BlogModule);

export async function resetState() {
  const posts = app.container.resolve(PostService);
  await posts.deleteAllPosts();
  const cache = app.container.resolve(MemoryCache) as any;
  if (cache && typeof cache.clear === "function") {
    cache.clear();
  }
}

export { dbAdapter };

export default app;
