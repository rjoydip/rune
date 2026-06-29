import { describe, it, expect } from "bun:test";
import { Body, Param, Query, Headers, Req, getMeta } from "../src/index";
import { PARAM_METADATA } from "../src/metadata";

describe("Parameter decorators", () => {
  class CreateDto {}
  class QueryDto {}

  it("Body stores param metadata", () => {
    class Test {
      @Body()
      create(_data: any) {}
    }
    const params = getMeta(Test.prototype.create, PARAM_METADATA) as any[];
    expect(params).toHaveLength(1);
    expect(params[0]).toMatchObject({ type: "body" });
  });

  it("Body with DTO stores dto in metadata", () => {
    class Test {
      @Body(CreateDto)
      create(_data: any) {}
    }
    const params = getMeta(Test.prototype.create, PARAM_METADATA) as any[];
    expect(params[0].dto).toBe(CreateDto);
  });

  it("Param stores param metadata", () => {
    class Test {
      @Param()
      get(_id: string) {}
    }
    const params = getMeta(Test.prototype.get, PARAM_METADATA) as any[];
    expect(params[0]).toMatchObject({ type: "param" });
  });

  it("Query stores param metadata", () => {
    class Test {
      @Query()
      search(_q: string) {}
    }
    const params = getMeta(Test.prototype.search, PARAM_METADATA) as any[];
    expect(params[0]).toMatchObject({ type: "query" });
  });

  it("Headers stores param metadata", () => {
    class Test {
      @Headers()
      headers(_h: any) {}
    }
    const params = getMeta(Test.prototype.headers, PARAM_METADATA) as any[];
    expect(params[0]).toMatchObject({ type: "headers" });
  });

  it("Req stores param metadata", () => {
    class Test {
      @Req()
      handle(_ctx: any) {}
    }
    const params = getMeta(Test.prototype.handle, PARAM_METADATA) as any[];
    expect(params[0]).toMatchObject({ type: "context" });
  });

  it("multiple params are ordered left-to-right (outer-to-inner)", () => {
    class Test {
      @Body()
      @Param()
      create(_data: any, _id: string) {}
    }
    const params = getMeta(Test.prototype.create, PARAM_METADATA) as any[];
    expect(params).toHaveLength(2);
    expect(params[0].type).toBe("body");
    expect(params[1].type).toBe("param");
  });

  it("Param with DTO stores dto", () => {
    class Test {
      @Query(QueryDto)
      search(_q: any) {}
    }
    const params = getMeta(Test.prototype.search, PARAM_METADATA) as any[];
    expect(params[0].dto).toBe(QueryDto);
  });
});
