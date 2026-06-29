import type { RuneApp } from "@rune/core";

/**
 * Shape of a Lambda@Edge CloudFront event record.
 */
export interface CloudFrontEvent {
  Records: {
    cf: {
      request: {
        uri: string;
        method: string;
        headers: Record<string, { key: string; value: string }[]>;
        querystring: string;
        clientIp: string;
      };
      config: {
        distributionId: string;
        requestId: string;
      };
    };
  }[];
}

/**
 * Shape of an API Gateway proxy event passed to a Lambda function.
 */
export interface APIGatewayEvent {
  /** The HTTP method of the request. */
  httpMethod: string;
  /** The request path. */
  path: string;
  /** The request headers. */
  headers: Record<string, string>;
  /** Query string parameters, or null if none. */
  queryStringParameters: Record<string, string> | null;
  /** The raw request body, or null if no body. */
  body: string | null;
  /** Whether the body is Base64-encoded. */
  isBase64Encoded: boolean;
}

/**
 * Shape of the response returned by a Lambda@Edge or API Gateway handler.
 */
export interface APIGatewayResult {
  /** The HTTP status code. */
  statusCode: number;
  /** Response headers. */
  headers: Record<string, string>;
  /** The response body as a string. */
  body: string;
  /** Whether the body is Base64-encoded. */
  isBase64Encoded: boolean;
}

/**
 * Creates a Lambda@Edge handler that routes CloudFront requests through the Rune application.
 * Parses the CloudFront event into a standard `Request`, delegates to `app.fetch()`,
 * and maps the `Response` back to the Lambda@Edge response format.
 *
 * @param app - The Rune application instance.
 * @returns A Lambda@Edge handler function compatible with CloudFront events.
 *
 * @example
 * ```ts
 * import { toLambdaEdgeHandler } from "@rune/adapter-lambda-edge";
 * import { createApp } from "@rune/core";
 *
 * const app = createApp();
 * export const handler = toLambdaEdgeHandler(app);
 * ```
 */
export function toLambdaEdgeHandler(
  app: RuneApp,
): (event: CloudFrontEvent) => Promise<APIGatewayResult> {
  return async (event: CloudFrontEvent): Promise<APIGatewayResult> => {
    const { request } = event.Records[0].cf;
    const qs = request.querystring ? `?${request.querystring}` : "";
    const url = `https://cloudfront.amazonaws.com${request.uri}${qs}`;

    const headerRecord: Record<string, string> = {};
    for (const [key, values] of Object.entries(request.headers)) {
      const val = Array.isArray(values) ? values[0]?.value : values;
      if (val) headerRecord[key] = val;
    }

    const res = await app.fetch(
      new Request(url, {
        method: request.method,
        headers: headerRecord,
      }),
    );

    const headers: Record<string, string> = {};
    res.headers.forEach((value, key) => {
      headers[key] = value;
    });

    return {
      statusCode: res.status,
      headers,
      body: await res.text(),
      isBase64Encoded: false,
    };
  };
}

/**
 * Creates an API Gateway proxy handler that routes REST API events through the Rune application.
 * Converts API Gateway events to standard `Request`, delegates to `app.fetch()`,
 * and maps the `Response` back to the API Gateway response format.
 *
 * @param app - The Rune application instance.
 * @returns An API Gateway handler function compatible with Lambda proxy integration.
 *
 * @example
 * ```ts
 * import { toAPIGatewayHandler } from "@rune/adapter-lambda-edge";
 * import { createApp } from "@rune/core";
 *
 * const app = createApp();
 * export const handler = toAPIGatewayHandler(app);
 * ```
 */
export function toAPIGatewayHandler(
  app: RuneApp,
): (event: APIGatewayEvent) => Promise<APIGatewayResult> {
  return async (event: APIGatewayEvent): Promise<APIGatewayResult> => {
    const qs = event.queryStringParameters
      ? "?" + new URLSearchParams(event.queryStringParameters).toString()
      : "";

    const url = `https://lambda.amazonaws.com${event.path}${qs}`;

    let body: BodyInit | undefined;
    if (event.body && event.httpMethod !== "GET" && event.httpMethod !== "HEAD") {
      body = event.isBase64Encoded ? Buffer.from(event.body, "base64") : event.body;
    }

    const request = new Request(url, {
      method: event.httpMethod,
      headers: event.headers,
      body,
    });

    const res = await app.fetch(request);

    const headers: Record<string, string> = {};
    res.headers.forEach((value, key) => {
      headers[key] = value;
    });

    return {
      statusCode: res.status,
      headers,
      body: await res.text(),
      isBase64Encoded: false,
    };
  };
}

/** @deprecated Use `toAPIGatewayHandler` or `toLambdaEdgeHandler` instead */
export const toLambdaHandler = toAPIGatewayHandler;
