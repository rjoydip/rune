import { describe, it, expect } from "bun:test";
import { handler } from "../index";
import type { APIGatewayV1Event, APIGatewayV2Event } from "@rune/adapter-aws-lambda";

describe("try-aws-lambda", () => {
  it("responds to GET /hello (v1 event)", async () => {
    const event: APIGatewayV1Event = {
      httpMethod: "GET",
      path: "/hello",
      headers: {},
      queryStringParameters: null,
      body: null,
      isBase64Encoded: false,
    };
    const result = await handler(event);
    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body)).toEqual({ message: "Hello from AWS Lambda!" });
  });

  it("responds to POST /data with body", async () => {
    const event: APIGatewayV1Event = {
      httpMethod: "POST",
      path: "/data",
      headers: { "content-type": "application/json" },
      queryStringParameters: null,
      body: JSON.stringify({ value: "test-data" }),
      isBase64Encoded: false,
    };
    const result = await handler(event);
    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body)).toEqual({ received: "test-data" });
  });

  it("responds to GET /hello (v2 event)", async () => {
    const event: APIGatewayV2Event = {
      requestContext: { http: { method: "GET", path: "/hello" } },
      headers: {},
      queryStringParameters: null,
      body: null,
      isBase64Encoded: false,
      rawPath: "/hello",
    };
    const result = await handler(event);
    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body)).toEqual({ message: "Hello from AWS Lambda!" });
  });

  it("returns 404 for unknown route", async () => {
    const event: APIGatewayV1Event = {
      httpMethod: "GET",
      path: "/unknown",
      headers: {},
      queryStringParameters: null,
      body: null,
      isBase64Encoded: false,
    };
    const result = await handler(event);
    expect(result.statusCode).toBe(404);
  });
});
