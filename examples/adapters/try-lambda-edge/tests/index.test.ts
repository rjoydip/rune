import { describe, it, expect } from "bun:test";
import { handler } from "../index";
import type { APIGatewayEvent } from "@rune/adapter-lambda-edge";

function mockEvent(overrides: Partial<APIGatewayEvent> = {}): APIGatewayEvent {
  return {
    httpMethod: "GET",
    path: "/",
    headers: {},
    queryStringParameters: null,
    body: null,
    isBase64Encoded: false,
    ...overrides,
  };
}

describe("try-lambda-edge", () => {
  it("responds to GET /hello", async () => {
    const result = await handler(
      mockEvent({
        httpMethod: "GET",
        path: "/hello",
      }),
    );
    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body)).toEqual({ message: "Hello from Lambda!" });
  });

  it("responds to POST /data with body", async () => {
    const result = await handler(
      mockEvent({
        httpMethod: "POST",
        path: "/data",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ value: "test-data" }),
      }),
    );
    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body)).toEqual({ received: "test-data" });
  });

  it("returns 404 for unknown route", async () => {
    const result = await handler(
      mockEvent({
        httpMethod: "GET",
        path: "/unknown",
      }),
    );
    expect(result.statusCode).toBe(404);
  });

  it("parses query string parameters", async () => {
    const result = await handler(
      mockEvent({
        httpMethod: "GET",
        path: "/hello",
        queryStringParameters: { foo: "bar" },
      }),
    );
    expect(result.statusCode).toBe(200);
  });
});
