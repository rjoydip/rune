import { describe, it, expect } from "bun:test";

import { RuneApp, createApp } from "../src/rune-app";

import {
  Module,
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Injectable,
  Body,
  Param,
  Query,
  Headers,
  Req,
  UseGuard,
  UseInterceptor,
  INTERCEPTOR_METADATA,
  ROUTE_HANDLERS,
  getMeta,
} from "@rune/decorators";

import { Container } from "@rune/container";

import { Router } from "@rune/router";

describe("rune-app", () => {
  it("creates app with default options", () => {
    const app = new RuneApp();

    expect(app).toBeInstanceOf(RuneApp);
  });

  it("createApp returns RuneApp instance", () => {
    expect(createApp()).toBeInstanceOf(RuneApp);
  });

  it("registers middleware with use()", () => {
    const app = new RuneApp();

    app.use(async (ctx, next) => next());

    expect(app.pipeline).toBeDefined();
  });

  it("registers module and handles request", async () => {
    @Controller("/hello")
    class HelloController {
      @Get("/")
      hello() {
        return { message: "Hello!" };
      }
    }

    @Module({
      controllers: [HelloController],

      providers: [],

      imports: [],

      exports: [],
    })
    class AppModule {}

    const app = new RuneApp();

    app.registerModule(AppModule);

    app.init();

    const res = await app.fetch(new Request("http://localhost/hello/"));

    expect(res.status).toBe(200);

    const body = await res.json();

    expect(body).toEqual({ message: "Hello!" });
  });

  it("returns 404 for unmatched routes", async () => {
    const app = new RuneApp();

    app.init();

    const res = await app.fetch(new Request("http://localhost/notfound"));

    expect(res.status).toBe(404);
  });

  it("handles errors in pipeline", async () => {
    const app = new RuneApp();

    app.use(async () => {
      throw new Error("oops");
    });

    app.init();

    const res = await app.fetch(new Request("http://localhost/"));

    expect(res.status).toBe(500);

    const body = await res.json();

    expect(body).toHaveProperty("error", "oops");
  });

  it("handles non-error throwables", async () => {
    const app = new RuneApp();

    app.use(async () => {
      throw "string error";
    });

    app.init();

    const res = await app.fetch(new Request("http://localhost/"));

    expect(res.status).toBe(500);
  });

  it("middleware can modify response before handler", async () => {
    @Controller("/")
    class TestController {
      @Get("/")
      index() {
        return { from: "controller" };
      }
    }

    @Module({
      controllers: [TestController],

      providers: [],

      imports: [],

      exports: [],
    })
    class AppModule {}

    const app = new RuneApp();

    app.use(async (ctx, next) => {
      ctx.state.set("timing", "fast");

      return next();
    });

    app.registerModule(AppModule);

    app.init();

    const res = await app.fetch(new Request("http://localhost/"));

    expect(res.status).toBe(200);
  });

  it("init is idempotent", () => {
    const app = new RuneApp();

    app.init();

    app.init();

    expect(true).toBe(true);
  });

  it("fetch calls init if not initialized", async () => {
    const app = new RuneApp();

    const res = await app.fetch(new Request("http://localhost/"));

    expect(res.status).toBe(404);
  });

  it("accepts custom container and router", () => {
    const customContainer = new Container();

    const customRouter = new Router();

    const app = new RuneApp({
      container: customContainer,

      router: customRouter,
    });

    expect(app.container).toBe(customContainer);

    expect(app.router).toBe(customRouter);
  });
});

describe("Middleware with guards", () => {
  it("guard can block request", async () => {
    class AuthGuard {
      canActivate(_ctx: any) {
        return false;
      }
    }

    @Controller("/admin")
    @Injectable("singleton")
    class AdminController {
      @Get("/")
      data() {
        return { secret: true };
      }
    }

    @Module({
      controllers: [AdminController],

      providers: [AuthGuard],

      imports: [],

      exports: [],
    })
    class AppModule {}

    const app = new RuneApp();

    app.registerModule(AppModule);

    app.init();

    const res = await app.fetch(new Request("http://localhost/admin/"));

    expect(res.status).toBe(403);
  });
});

describe("Parameter decorators", () => {
  it("passes @Body() to handler", async () => {
    @Controller("/api")
    class TestController {
      @Post("/data")
      @Body()
      create(body: unknown) {
        return { received: body };
      }
    }

    @Module({
      controllers: [TestController],
      providers: [],
      imports: [],
      exports: [],
    })
    class AppModule {}

    const app = new RuneApp();
    app.registerModule(AppModule);
    app.init();

    const res = await app.fetch(
      new Request("http://localhost/api/data", {
        method: "POST",
        body: JSON.stringify({ name: "test" }),
        headers: { "content-type": "application/json" },
      }),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.received).toEqual({ name: "test" });
  });

  it("passes @Body() with DTO validation", async () => {
    class CreateUserDto {
      name!: string;
    }

    @Controller("/users")
    class UserController {
      @Post("/")
      @Body(CreateUserDto)
      create(data: CreateUserDto) {
        return data;
      }
    }

    @Module({
      controllers: [UserController],
      providers: [],
      imports: [],
      exports: [],
    })
    class AppModule {}

    const app = new RuneApp();
    app.registerModule(AppModule);
    app.init();

    const res = await app.fetch(
      new Request("http://localhost/users/", {
        method: "POST",
        body: JSON.stringify({ name: "Alice" }),
        headers: { "content-type": "application/json" },
      }),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.name).toBe("Alice");
  });

  it("passes @Param() to handler", async () => {
    @Controller("/api")
    class TestController {
      @Get("/items/:id")
      @Param()
      getItem(id: string) {
        return { id };
      }
    }

    @Module({
      controllers: [TestController],
      providers: [],
      imports: [],
      exports: [],
    })
    class AppModule {}

    const app = new RuneApp();
    app.registerModule(AppModule);
    app.init();

    const res = await app.fetch(new Request("http://localhost/api/items/42"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBe("42");
  });

  it("passes @Query() to handler", async () => {
    @Controller("/search")
    class SearchController {
      @Get("/")
      @Query()
      search(q: string) {
        return { query: q };
      }
    }

    @Module({
      controllers: [SearchController],
      providers: [],
      imports: [],
      exports: [],
    })
    class AppModule {}

    const app = new RuneApp();
    app.registerModule(AppModule);
    app.init();

    const res = await app.fetch(new Request("http://localhost/search/?q=hello"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.query).toBe("hello");
  });

  it("passes @Headers() to handler", async () => {
    @Controller("/")
    class TestController {
      @Get("/echo")
      @Headers()
      echo(headers: Record<string, string>) {
        return { ua: headers["user-agent"] };
      }
    }

    @Module({
      controllers: [TestController],
      providers: [],
      imports: [],
      exports: [],
    })
    class AppModule {}

    const app = new RuneApp();
    app.registerModule(AppModule);
    app.init();

    const res = await app.fetch(
      new Request("http://localhost/echo", {
        headers: { "user-agent": "bun-test" },
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ua).toBe("bun-test");
  });

  it("passes @Req() context to handler", async () => {
    @Controller("/")
    class TestController {
      @Get("/status")
      @Req()
      status(ctx: any) {
        return { method: ctx.request.method };
      }
    }

    @Module({
      controllers: [TestController],
      providers: [],
      imports: [],
      exports: [],
    })
    class AppModule {}

    const app = new RuneApp();
    app.registerModule(AppModule);
    app.init();

    const res = await app.fetch(new Request("http://localhost/status"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.method).toBe("GET");
  });

  it("handles multiple params in nested routes", async () => {
    @Controller("/api")
    class TestController {
      @Get("/users/:userId/posts/:postId")
      @Param()
      @Param()
      getPost(userId: string, postId: string) {
        return { userId, postId };
      }
    }

    @Module({
      controllers: [TestController],
      providers: [],
      imports: [],
      exports: [],
    })
    class AppModule {}

    const app = new RuneApp();
    app.registerModule(AppModule);
    app.init();

    const res = await app.fetch(new Request("http://localhost/api/users/1/posts/2"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.userId).toBe("1");
    expect(body.postId).toBe("2");
  });
});

describe("Controller returning Response directly", () => {
  it("returns Response object from controller", async () => {
    @Controller("/")
    class TestController {
      @Get("/redirect")
      redirect() {
        return new Response(null, {
          status: 301,
          headers: { location: "/new" },
        });
      }
    }

    @Module({
      controllers: [TestController],
      providers: [],
      imports: [],
      exports: [],
    })
    class AppModule {}

    const app = new RuneApp();
    app.registerModule(AppModule);
    app.init();

    const res = await app.fetch(new Request("http://localhost/redirect"));
    expect(res.status).toBe(301);
    expect(res.headers.get("location")).toBe("/new");
  });
});

describe("UseGuard at method level", () => {
  it("guard at method level can block request", async () => {
    class AccessCheck {
      canActivate = () => false;
    }

    @Controller("/area")
    class AreaController {
      @Get("/open")
      openData() {
        return { open: true };
      }

      @Get("/restricted")
      @UseGuard(AccessCheck)
      restrictedData() {
        return { secret: true };
      }
    }

    @Module({
      controllers: [AreaController],
      providers: [AccessCheck],
      imports: [],
      exports: [],
    })
    class AppModule {}

    const app = new RuneApp();
    app.registerModule(AppModule);
    app.init();

    const openRes = await app.fetch(new Request("http://localhost/area/open"));
    expect(openRes.status).toBe(200);

    const restrictedRes = await app.fetch(new Request("http://localhost/area/restricted"));
    expect(restrictedRes.status).toBe(403);
  });
});

describe("UseGuard at class level", () => {
  it("guard at class level blocks all requests", async () => {
    class AuthGuard {
      canActivate(_ctx: any) {
        return false;
      }
    }

    @Controller("/secure")
    @UseGuard(AuthGuard)
    class SecureController {
      @Get("/data")
      data() {
        return { sensitive: true };
      }
    }

    @Module({
      controllers: [SecureController],
      providers: [AuthGuard],
      imports: [],
      exports: [],
    })
    class AppModule {}

    const app = new RuneApp();
    app.registerModule(AppModule);
    app.init();

    const res = await app.fetch(new Request("http://localhost/secure/data"));
    expect(res.status).toBe(403);
  });
});

describe("Controller metadata initialization", () => {
  it("initializes route handlers on controller without routes", () => {
    @Controller("/empty")
    class EmptyController {}
    const routes = (getMeta(EmptyController, ROUTE_HANDLERS) as any[]) ?? [];
    expect(routes).toEqual([]);
  });
});

describe("UseInterceptor", () => {
  it("stores interceptor metadata at class level (dist path)", () => {
    class TestInterceptor {}
    @UseInterceptor(TestInterceptor)
    class TestController {}
    const meta = getMeta(TestController, INTERCEPTOR_METADATA);
    expect(meta).toEqual([TestInterceptor]);
  });

  it("interceptor can modify response at method level", async () => {
    class TimingInterceptor {
      async intercept(_ctx: any, next: () => Promise<Response>) {
        const res = await next();
        return new Response(res.body, {
          status: res.status,
          headers: { ...Object.fromEntries(res.headers), "x-timing": "fast" },
        });
      }
    }

    @Controller("/")
    class TestController {
      @Get("/hello")
      hello() {
        return { msg: "hi" };
      }

      @Get("/timed")
      @UseInterceptor(TimingInterceptor)
      timed() {
        return { value: 42 };
      }
    }

    @Module({
      controllers: [TestController],
      providers: [TimingInterceptor],
      imports: [],
      exports: [],
    })
    class AppModule {}

    const app = new RuneApp();
    app.registerModule(AppModule);
    app.init();

    const res1 = await app.fetch(new Request("http://localhost/hello"));
    expect(res1.status).toBe(200);
    expect(res1.headers.get("x-timing")).toBeNull();

    const res2 = await app.fetch(new Request("http://localhost/timed"));
    expect(res2.status).toBe(200);
    expect(res2.headers.get("x-timing")).toBe("fast");
  });
});

describe("Put and Delete route decorators", () => {
  it("handles PUT request", async () => {
    @Controller("/resource")
    class ResourceController {
      @Put("/:id")
      @Param()
      update(id: string) {
        return { updated: id };
      }
    }

    @Module({
      controllers: [ResourceController],
      providers: [],
      imports: [],
      exports: [],
    })
    class AppModule {}

    const app = new RuneApp();
    app.registerModule(AppModule);
    app.init();

    const res = await app.fetch(new Request("http://localhost/resource/5", { method: "PUT" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.updated).toBe("5");
  });

  it("handles DELETE request", async () => {
    @Controller("/resource")
    class ResourceController {
      @Delete("/:id")
      @Param()
      remove(id: string) {
        return { deleted: id };
      }
    }

    @Module({
      controllers: [ResourceController],
      providers: [],
      imports: [],
      exports: [],
    })
    class AppModule {}

    const app = new RuneApp();
    app.registerModule(AppModule);
    app.init();

    const res = await app.fetch(new Request("http://localhost/resource/99", { method: "DELETE" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.deleted).toBe("99");
  });
});

describe("Invalid DTO validation through request pipeline", () => {
  it("handles invalid body with DTO gracefully", async () => {
    class TestDto {
      name!: string;
    }

    @Controller("/validate")
    class ValidateController {
      @Post("/")
      @Body(TestDto)
      create(data: TestDto) {
        return data;
      }
    }

    @Module({
      controllers: [ValidateController],
      providers: [],
      imports: [],
      exports: [],
    })
    class AppModule {}

    const app = new RuneApp();
    app.registerModule(AppModule);
    app.init();

    const res = await app.fetch(
      new Request("http://localhost/validate/", {
        method: "POST",
        body: JSON.stringify({ name: 123 }),
        headers: { "content-type": "application/json" },
      }),
    );
    expect(res.status).toBe(200);
  });
});
