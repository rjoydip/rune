import { createApp, Context, NextFunction } from "@rune/core";
import { Module, Controller, Get, Post, Body, Req, Deps } from "@rune/decorators";
import { MemoryCache } from "@rune/cache";
import { ConsoleLogger } from "@rune/logger";
import { NoopTelemetry } from "@rune/telemetry";

class RegisterDto {
  username!: string;
  email!: string;
  password!: string;
}

class LoginDto {
  email!: string;
  password!: string;
}

class UserService {
  private users = new Map<string, any>();
  private tokens = new Map<string, string>();

  getUser(email: string): any {
    const user = this.users.get(email);
    if (!user) return null;
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      createdAt: user.createdAt,
    };
  }

  clearState(): void {
    this.users.clear();
    this.tokens.clear();
  }

  async register(data: RegisterDto): Promise<any> {
    if (this.users.has(data.email)) {
      throw new Error("Email already registered");
    }
    const id = `user-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const user = {
      id,
      username: data.username,
      email: data.email,
      password: data.password,
      createdAt: new Date().toISOString(),
    };
    this.users.set(data.email, user);
    return { id: user.id, username: user.username, email: user.email, createdAt: user.createdAt };
  }

  async login(email: string, password: string): Promise<any> {
    const user = this.users.get(email);
    if (!user || user.password !== password) {
      throw new Error("Invalid email or password");
    }
    const token = `tok-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    this.tokens.set(token, email);
    return {
      token,
      user: { id: user.id, username: user.username, email: user.email, createdAt: user.createdAt },
    };
  }

  async getUserByToken(token: string): Promise<any> {
    const email = this.tokens.get(token);
    if (!email) return null;
    const user = this.users.get(email);
    if (!user) return null;
    return { id: user.id, username: user.username, email: user.email, createdAt: user.createdAt };
  }

  getUserById(id: string): any {
    for (const user of this.users.values()) {
      if (user.id === id) {
        return {
          id: user.id,
          username: user.username,
          email: user.email,
          createdAt: user.createdAt,
        };
      }
    }
    return null;
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
        headers: { "content-type": "application/json" },
      });
    } catch (error) {
      span.setStatus({ code: 2, message: error instanceof Error ? error.message : String(error) });
      span.end();
      return new Response(JSON.stringify({ error: "Invalid email or password" }), {
        status: 401,
        headers: { "content-type": "application/json" },
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
        headers: { "content-type": "application/json" },
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

export function resetState() {
  const us = app.container.resolve(UserService);
  us.clearState();
}

export { UserService };

export default app;
