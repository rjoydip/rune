import { createApp, Context, NextFunction } from "@rune/core";
import { Scope } from "@rune/container";
import { Module, Controller, Get, Post, Body, Req, Deps } from "@rune/decorators";
import { PrismaAdapter } from "@rune/database";
import { MemoryCache } from "@rune/cache";
import { ConsoleLogger } from "@rune/logger";
import { NoopTelemetry } from "@rune/telemetry";
import { PrismaClient } from "@prisma/client";

const dbUrl = process.env["DATABASE_URL"] ?? `file:${import.meta.dir}/dev.db`;
const prisma = new PrismaClient({
  datasources: { db: { url: dbUrl } },
});
const dbAdapter = new PrismaAdapter(prisma);

// Connect eagerly so the adapter lifecycle hooks can be idempotent
await prisma.$connect();

// Bootstrap tables at import time so the app works without running prisma db push
await prisma.$executeRawUnsafe(
  `CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT PRIMARY KEY,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL UNIQUE,
    "password" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
);
await prisma.$executeRawUnsafe(
  `CREATE TABLE IF NOT EXISTS "Token" (
    "id" TEXT PRIMARY KEY,
    "value" TEXT NOT NULL UNIQUE,
    "email" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
);

const JSON_HEADERS = { "content-type": "application/json" as const };

class RegisterDto {
  username!: string;
  email!: string;
  password!: string;
}

class LoginDto {
  email!: string;
  password!: string;
}

@Deps(PrismaAdapter)
class UserService {
  constructor(private db: PrismaAdapter<any>) {}

  async register(data: RegisterDto): Promise<any> {
    const existing = await this.db.client.user.findUnique({
      where: { email: data.email },
    });
    if (existing) {
      throw new Error("Email already registered");
    }

    const user = await this.db.client.user.create({
      data: {
        username: data.username,
        email: data.email,
        password: data.password,
      },
      select: { id: true, username: true, email: true, createdAt: true },
    });
    return user;
  }

  async login(email: string, password: string): Promise<any> {
    const user = await this.db.client.user.findUnique({
      where: { email },
    });
    if (!user || user.password !== password) {
      throw new Error("Invalid email or password");
    }

    const tokenValue = `tok-${crypto.randomUUID()}`;
    await this.db.client.token.create({
      data: { value: tokenValue, email: user.email },
    });

    return {
      token: tokenValue,
      user: { id: user.id, username: user.username, email: user.email, createdAt: user.createdAt },
    };
  }

  async getUserByToken(token: string): Promise<any> {
    const record = await this.db.client.token.findUnique({
      where: { value: token },
    });
    if (!record) return null;

    const user = await this.db.client.user.findUnique({
      where: { email: record.email },
    });
    if (!user) return null;
    return { id: user.id, username: user.username, email: user.email, createdAt: user.createdAt };
  }

  async getUser(email: string): Promise<any> {
    const user = await this.db.client.user.findUnique({
      where: { email },
      select: { id: true, username: true, email: true, createdAt: true },
    });
    return user;
  }

  async getUserById(id: string): Promise<any> {
    const user = await this.db.client.user.findUnique({
      where: { id },
      select: { id: true, username: true, email: true, createdAt: true },
    });
    return user;
  }

  async clearState(): Promise<void> {
    await this.db.client.token.deleteMany();
    await this.db.client.user.deleteMany();
  }
}

@Deps(UserService, MemoryCache, ConsoleLogger, NoopTelemetry)
@Controller("/api/v1/auth")
class AuthController {
  constructor(
    private userService: UserService,
    private cache: MemoryCache,
    private logger: ConsoleLogger,
    private telemetry: NoopTelemetry,
  ) {}

  @Post("/register")
  @Body(RegisterDto)
  async register(body: RegisterDto): Promise<Response> {
    const span = this.telemetry.startSpan("register", { email: body.email });
    try {
      const user = await this.userService.register(body);
      await this.cache.set(`user:${user.id}`, user, 300);
      this.logger.info("User registered", { id: user.id, email: user.email });
      span.setAttribute("user.id", user.id);
      span.end();
      return new Response(JSON.stringify(user), {
        status: 201,
        headers: JSON_HEADERS,
      });
    } catch (error) {
      span.setStatus({ code: 2, message: error instanceof Error ? error.message : String(error) });
      span.end();
      const message = error instanceof Error ? error.message : String(error);
      return new Response(JSON.stringify({ error: message }), {
        status: 400,
        headers: JSON_HEADERS,
      });
    }
  }

  @Post("/login")
  @Body(LoginDto)
  async login(body: LoginDto): Promise<Response> {
    const span = this.telemetry.startSpan("login", { email: body.email });
    try {
      const result = await this.userService.login(body.email, body.password);
      this.logger.info("User logged in", { email: body.email });
      span.setAttribute("user.email", body.email);
      span.end();
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: JSON_HEADERS,
      });
    } catch (error) {
      span.setStatus({ code: 2, message: error instanceof Error ? error.message : String(error) });
      span.end();
      return new Response(JSON.stringify({ error: "Invalid email or password" }), {
        status: 401,
        headers: JSON_HEADERS,
      });
    }
  }

  @Get("/profile")
  @Req()
  async profile(ctx: Context): Promise<Response> {
    const span = this.telemetry.startSpan("profile", {});
    try {
      const user = (ctx.state.get("user") || { id: "unknown" }) as any;
      span.setAttribute("user.id", user.id);
      span.end();
      return new Response(JSON.stringify(user), {
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
  controllers: [AuthController],
  providers: [UserService, MemoryCache, ConsoleLogger, NoopTelemetry],
  imports: [],
  exports: [],
})
class AuthModule {}

const app = createApp();
app.container.register({
  token: PrismaAdapter,
  useValue: dbAdapter,
  scope: Scope.Singleton,
});

app.onDestroy(async () => {
  await dbAdapter.disconnect();
});

app.use(async (ctx: Context, next: NextFunction) => {
  if (ctx.request.url.includes("/api/v1/auth/profile")) {
    const authHeader = ctx.request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      ctx.send({ error: "Authentication required" }, 401);
      return;
    }
    const token = authHeader.substring(7);
    const userService = app.container.resolve(UserService);
    const user = await userService.getUserByToken(token);
    if (!user) {
      ctx.send({ error: "Invalid or expired token" }, 401);
      return;
    }
    ctx.state.set("user", user);
  }
  await next();
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

app.registerModule(AuthModule);
await app.init();

export async function resetState() {
  const us = app.container.resolve(UserService);
  await us.clearState();
}

export { UserService };

export default app;
