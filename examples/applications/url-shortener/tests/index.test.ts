import { describe, it, expect, beforeEach } from "bun:test";
import app, { resetState } from "../index";

describe("url-shortener", () => {
  beforeEach(() => {
    resetState();
  });

  it("creates a short URL", async () => {
    const res = await app.fetch(
      new Request("http://localhost/api/v1/urls", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: "Bearer shortener-secret-token-2024",
        },
        body: JSON.stringify({
          url: "https://example.com/very/long/url",
        }),
      }),
    );
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.code).toBeDefined();
    expect(data.code.length).toBe(6);
    expect(data.url).toBe("https://example.com/very/long/url");
    expect(data.clicks).toBe(0);
  });

  it("gets stats for a short URL", async () => {
    const createRes = await app.fetch(
      new Request("http://localhost/api/v1/urls", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: "Bearer shortener-secret-token-2024",
        },
        body: JSON.stringify({
          url: "https://example.com/stats-test",
        }),
      }),
    );
    const created = await createRes.json();

    const statsRes = await app.fetch(
      new Request(`http://localhost/api/v1/urls/${created.code}/stats`, {
        headers: { authorization: "Bearer shortener-secret-token-2024" },
      }),
    );
    expect(statsRes.status).toBe(200);
    const stats = await statsRes.json();
    expect(stats.code).toBe(created.code);
    expect(stats.url).toBe("https://example.com/stats-test");
    expect(typeof stats.clicks).toBe("number");
  });

  it("lists all URLs", async () => {
    await app.fetch(
      new Request("http://localhost/api/v1/urls", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: "Bearer shortener-secret-token-2024",
        },
        body: JSON.stringify({ url: "https://example.com/1" }),
      }),
    );
    await app.fetch(
      new Request("http://localhost/api/v1/urls", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: "Bearer shortener-secret-token-2024",
        },
        body: JSON.stringify({ url: "https://example.com/2" }),
      }),
    );

    const listRes = await app.fetch(
      new Request("http://localhost/api/v1/urls", {
        headers: { authorization: "Bearer shortener-secret-token-2024" },
      }),
    );
    expect(listRes.status).toBe(200);
    const data = await listRes.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(2);
  });

  it("redirects to original URL", async () => {
    const createRes = await app.fetch(
      new Request("http://localhost/api/v1/urls", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: "Bearer shortener-secret-token-2024",
        },
        body: JSON.stringify({ url: "https://example.com/redirect-test" }),
      }),
    );
    const created = await createRes.json();

    const redirectRes = await app.fetch(new Request(`http://localhost/${created.code}`));
    expect(redirectRes.status).toBe(302);
    expect(redirectRes.headers.get("location")).toBe("https://example.com/redirect-test");
  });

  it("creates with custom slug", async () => {
    const res = await app.fetch(
      new Request("http://localhost/api/v1/urls", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: "Bearer shortener-secret-token-2024",
        },
        body: JSON.stringify({
          url: "https://example.com/custom",
          customSlug: "my-link",
        }),
      }),
    );
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.code).toBe("my-link");
    expect(data.url).toBe("https://example.com/custom");
  });

  it("returns 401 for invalid token", async () => {
    const res = await app.fetch(
      new Request("http://localhost/api/v1/urls", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: "Bearer invalid-token",
        },
        body: JSON.stringify({ url: "https://example.com/test" }),
      }),
    );
    expect(res.status).toBe(401);
  });

  it("returns 401 for missing auth header on API", async () => {
    const res = await app.fetch(
      new Request("http://localhost/api/v1/urls", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: "https://example.com/test" }),
      }),
    );
    expect(res.status).toBe(401);
  });

  it("returns 400 for duplicate custom slug", async () => {
    await app.fetch(
      new Request("http://localhost/api/v1/urls", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: "Bearer shortener-secret-token-2024",
        },
        body: JSON.stringify({ url: "https://example.com/first", customSlug: "taken" }),
      }),
    );

    const res = await app.fetch(
      new Request("http://localhost/api/v1/urls", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: "Bearer shortener-secret-token-2024",
        },
        body: JSON.stringify({ url: "https://example.com/second", customSlug: "taken" }),
      }),
    );
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("Slug already in use");
  });

  it("returns 404 for non-existent stats", async () => {
    const res = await app.fetch(
      new Request("http://localhost/api/v1/urls/nonexistent/stats", {
        headers: { authorization: "Bearer shortener-secret-token-2024" },
      }),
    );
    expect(res.status).toBe(404);
  });

  it("returns 404 for non-existent redirect", async () => {
    const res = await app.fetch(new Request("http://localhost/nonexistent"));
    expect(res.status).toBe(404);
  });
});
