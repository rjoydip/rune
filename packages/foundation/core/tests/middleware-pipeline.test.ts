import { describe, it, expect, mock } from "bun:test";
import { MiddlewarePipeline } from "../src/middleware-pipeline";
import { Context } from "../src/context";
import { Container } from "@rune/container";

function makeCtx(): Context {
  return new Context(new Request("http://localhost"), {}, new Container());
}

describe("middleware-pipeline", () => {
  it("executes middleware in order", async () => {
    const order: number[] = [];
    const pipeline = new MiddlewarePipeline();
    pipeline.use(async (_, next) => {
      order.push(1);
      return next();
    });
    pipeline.use(async (_, next) => {
      order.push(2);
      return next();
    });

    const composed = pipeline.compose(async () => {
      order.push(3);
    });
    await composed(makeCtx());
    expect(order).toEqual([1, 2, 3]);
  });

  it("short-circuits when middleware returns response", async () => {
    const pipeline = new MiddlewarePipeline();
    pipeline.use(async () => new Response("blocked", { status: 403 }));

    const middleware = mock();
    const composed = pipeline.compose(middleware);
    const ctx = makeCtx();
    await composed(ctx);
    expect(ctx.response?.status).toBe(403);
    expect(middleware).not.toHaveBeenCalled();
  });

  it("propagates errors from middleware", async () => {
    const pipeline = new MiddlewarePipeline();
    pipeline.use(async () => {
      throw new Error("middleware error");
    });

    const composed = pipeline.compose(async () => {});
    await expect(composed(makeCtx())).rejects.toThrow("middleware error");
  });

  it("catches next() called multiple times", async () => {
    const pipeline = new MiddlewarePipeline();
    pipeline.use(async (_, next) => {
      await next();
      await next();
    });

    const composed = pipeline.compose(async () => {});
    await expect(composed(makeCtx())).rejects.toThrow("next() called multiple times");
  });

  it("handler calling next resolves gracefully (dispatch past end of stack)", async () => {
    const pipeline = new MiddlewarePipeline();
    const order: number[] = [];
    pipeline.use(async (_, next) => {
      order.push(1);
      return next();
    });

    const composed = pipeline.compose(async (_, next) => {
      order.push(2);
      await next();
      order.push(3);
    });
    await composed(makeCtx());
    expect(order).toEqual([1, 2, 3]);
  });

  it("empty middleware list still runs handler", async () => {
    const pipeline = new MiddlewarePipeline();
    const handler = mock(async () => new Response("ok"));
    const composed = pipeline.compose(handler);
    await composed(makeCtx());
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("sets context.response from middleware return", async () => {
    const pipeline = new MiddlewarePipeline();
    pipeline.use(async () => new Response("from middleware"));
    const composed = pipeline.compose(async () => {});
    const ctx = makeCtx();
    await composed(ctx);
    expect(ctx.response).not.toBeNull();
    expect(await ctx.response!.text()).toBe("from middleware");
  });
});
