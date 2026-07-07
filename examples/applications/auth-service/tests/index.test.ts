import { describe, it, expect, beforeEach } from "bun:test";
import app, { resetState } from "../index";

describe("auth-service", () => {
  beforeEach(async () => {
    await resetState();
  });

  it("registers a new user", async () => {
    const res = await app.fetch(
      new Request("http://localhost/api/v1/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          username: "alice",
          email: "alice@example.com",
          password: "secret123",
        }),
      }),
    );
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.id).toBeDefined();
    expect(data.username).toBe("alice");
    expect(data.email).toBe("alice@example.com");
    expect(data.password).toBeUndefined();
  });

  it("logs in with correct credentials", async () => {
    await app.fetch(
      new Request("http://localhost/api/v1/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          username: "bob",
          email: "bob@example.com",
          password: "password123",
        }),
      }),
    );

    const loginRes = await app.fetch(
      new Request("http://localhost/api/v1/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: "bob@example.com",
          password: "password123",
        }),
      }),
    );
    expect(loginRes.status).toBe(200);
    const data = await loginRes.json();
    expect(data.token).toBeDefined();
    expect(data.user.email).toBe("bob@example.com");
    expect(data.user.password).toBeUndefined();
  });

  it("returns 401 for login with wrong password", async () => {
    await app.fetch(
      new Request("http://localhost/api/v1/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          username: "charlie",
          email: "charlie@example.com",
          password: "correctpass",
        }),
      }),
    );

    const loginRes = await app.fetch(
      new Request("http://localhost/api/v1/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: "charlie@example.com",
          password: "wrongpass",
        }),
      }),
    );
    expect(loginRes.status).toBe(401);
    const data = await loginRes.json();
    expect(data.error).toBeDefined();
  });

  it("gets profile with valid token", async () => {
    await app.fetch(
      new Request("http://localhost/api/v1/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          username: "dave",
          email: "dave@example.com",
          password: "mypassword",
        }),
      }),
    );

    const loginRes = await app.fetch(
      new Request("http://localhost/api/v1/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: "dave@example.com",
          password: "mypassword",
        }),
      }),
    );
    const { token } = await loginRes.json();

    const profileRes = await app.fetch(
      new Request("http://localhost/api/v1/auth/profile", {
        headers: { authorization: `Bearer ${token}` },
      }),
    );
    expect(profileRes.status).toBe(200);
  });

  it("returns 401 for invalid token on profile", async () => {
    const res = await app.fetch(
      new Request("http://localhost/api/v1/auth/profile", {
        headers: { authorization: "Bearer invalid-token-here" },
      }),
    );
    expect(res.status).toBe(401);
  });

  it("returns 401 for missing auth header on profile", async () => {
    const res = await app.fetch(new Request("http://localhost/api/v1/auth/profile"));
    expect(res.status).toBe(401);
  });

  it("returns 400 for duplicate email registration", async () => {
    await app.fetch(
      new Request("http://localhost/api/v1/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          username: "first",
          email: "duplicate@example.com",
          password: "password123",
        }),
      }),
    );

    const res = await app.fetch(
      new Request("http://localhost/api/v1/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          username: "second",
          email: "duplicate@example.com",
          password: "differentpass",
        }),
      }),
    );
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("Email already registered");
  });
});
