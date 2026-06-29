import type { RuneApp } from "@rune/core";

/**
 * Shape of an API Gateway v1 (REST API) proxy event.
 */
export interface APIGatewayV1Event {
  httpMethod: string;
  path: string;
  headers: Record<string, string>;
  queryStringParameters: Record<string, string> | null;
  body: string | null;
  isBase64Encoded: boolean;
  requestContext?: Record<string, unknown>;
}

/**
 * Shape of an API Gateway v2 (HTTP API) proxy event.
 */
export interface APIGatewayV2Event {
  requestContext: {
    http: {
      method: string;
      path: string;
    };
  };
  headers: Record<string, string>;
  queryStringParameters: Record<string, string> | null;
  body: string | null;
  isBase64Encoded: boolean;
  rawPath: string;
}

/**
 * Shape of an ALB (Application Load Balancer) event.
 */
export interface ALBEvent {
  httpMethod: string;
  path: string;
  headers: Record<string, string>;
  queryStringParameters: Record<string, string> | null;
  body: string | null;
  isBase64Encoded: boolean;
}

/**
 * Shape of the response returned to API Gateway / ALB / Lambda Function URL.
 */
export interface AwsLambdaResult {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
  isBase64Encoded: boolean;
}

/**
 * Supported AWS Lambda event types for automatic detection.
 */
export type AwsLambdaEvent = APIGatewayV1Event | APIGatewayV2Event | ALBEvent;

/**
 * Creates an AWS Lambda handler that supports multiple invocation sources:
 * API Gateway v1 (REST API), API Gateway v2 (HTTP API), ALB, and Lambda Function URLs.
 *
 * Automatically detects the event format and converts it to a standard `Request`,
 * delegates to `app.fetch()`, and maps the `Response` back to the expected response shape.
 *
 * @param app - The Rune application instance.
 * @returns An AWS Lambda handler function.
 *
 * @example
 * ```ts
 * import { toAwsLambda } from "@rune/adapter-aws-lambda";
 * import { createApp } from "@rune/core";
 *
 * const app = createApp();
 * export const handler = toAwsLambda(app);
 * ```
 */
export function toAwsLambda(
  app: RuneApp,
): (event: AwsLambdaEvent, context?: unknown) => Promise<AwsLambdaResult> {
  return async (event: AwsLambdaEvent, _context?: unknown): Promise<AwsLambdaResult> => {
    const { httpMethod, path, headers, queryStringParameters, body, isBase64Encoded } =
      normalizeEvent(event);

    const qs = queryStringParameters
      ? "?" + new URLSearchParams(queryStringParameters).toString()
      : "";

    const url = `https://lambda.amazonaws.com${path}${qs}`;

    let reqBody: BodyInit | undefined;
    if (body && httpMethod !== "GET" && httpMethod !== "HEAD") {
      reqBody = isBase64Encoded ? Buffer.from(body, "base64") : body;
    }

    const request = new Request(url, {
      method: httpMethod,
      headers,
      body: reqBody,
    });

    const res = await app.fetch(request);

    const responseHeaders: Record<string, string> = {};
    res.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    return {
      statusCode: res.status,
      headers: responseHeaders,
      body: await res.text(),
      isBase64Encoded: false,
    };
  };
}

function normalizeEvent(event: AwsLambdaEvent): {
  httpMethod: string;
  path: string;
  headers: Record<string, string>;
  queryStringParameters: Record<string, string> | null;
  body: string | null;
  isBase64Encoded: boolean;
} {
  if ("rawPath" in event) {
    const v2 = event as APIGatewayV2Event;
    return {
      httpMethod: v2.requestContext.http.method,
      path: v2.rawPath,
      headers: v2.headers,
      queryStringParameters: v2.queryStringParameters ?? null,
      body: v2.body ?? null,
      isBase64Encoded: v2.isBase64Encoded ?? false,
    };
  }

  const v1 = event as APIGatewayV1Event;
  return {
    httpMethod: v1.httpMethod,
    path: v1.path,
    headers: v1.headers,
    queryStringParameters: v1.queryStringParameters ?? null,
    body: v1.body ?? null,
    isBase64Encoded: v1.isBase64Encoded ?? false,
  };
}
