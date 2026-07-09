import { describe, it, expect, beforeEach } from "bun:test";
import app, { resetState } from "../index";

describe("blog-api", () => {
  beforeEach(async () => {
    await resetState();
  });

  it("creates a new post", async () => {
    const res = await app.fetch(
      new Request("http://localhost/api/posts", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: "Bearer secret-token-123",
        },
        body: JSON.stringify({
          title: "Hello World",
          content: "This is my first post",
          author: "alice",
          tags: ["intro", "hello"],
        }),
      }),
    );
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.id).toBeDefined();
    expect(data.title).toBe("Hello World");
    expect(data.author).toBe("alice");
  });

  it("gets a post by ID", async () => {
    const createRes = await app.fetch(
      new Request("http://localhost/api/posts", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: "Bearer secret-token-123",
        },
        body: JSON.stringify({
          title: "Test Post",
          content: "Test content",
          author: "bob",
        }),
      }),
    );
    const created = await createRes.json();

    const getRes = await app.fetch(
      new Request(`http://localhost/api/posts/${created.id}`, {
        headers: { authorization: "Bearer secret-token-123" },
      }),
    );
    expect(getRes.status).toBe(200);
    const data = await getRes.json();
    expect(data.id).toBe(created.id);
    expect(data.title).toBe("Test Post");
  });

  it("gets posts list", async () => {
    const res = await app.fetch(
      new Request("http://localhost/api/posts?author=charlie", {
        headers: { authorization: "Bearer secret-token-123" },
      }),
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
  });

  it("updates a post", async () => {
    const createRes = await app.fetch(
      new Request("http://localhost/api/posts", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: "Bearer secret-token-123",
        },
        body: JSON.stringify({
          title: "Original Title",
          content: "Original content",
          author: "dave",
        }),
      }),
    );
    const created = await createRes.json();

    const updateRes = await app.fetch(
      new Request(`http://localhost/api/posts/${created.id}`, {
        method: "PUT",
        headers: {
          "content-type": "application/json",
          authorization: "Bearer secret-token-123",
        },
        body: JSON.stringify({
          title: "Updated Title",
        }),
      }),
    );
    expect(updateRes.status).toBe(200);
    const data = await updateRes.json();
    expect(data.id).toBe(created.id);
    expect(data.title).toBe("Updated Title");
    expect(data.content).toBe("Original content");
  });

  it("deletes a post", async () => {
    const createRes = await app.fetch(
      new Request("http://localhost/api/posts", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: "Bearer secret-token-123",
        },
        body: JSON.stringify({
          title: "To be deleted",
          content: "This will be deleted",
          author: "eve",
        }),
      }),
    );
    const created = await createRes.json();

    const deleteRes = await app.fetch(
      new Request(`http://localhost/api/posts/${created.id}`, {
        method: "DELETE",
        headers: { authorization: "Bearer secret-token-123" },
      }),
    );
    expect(deleteRes.status).toBe(200);
    const data = await deleteRes.json();
    expect(data.success).toBe(true);

    const getRes = await app.fetch(
      new Request(`http://localhost/api/posts/${created.id}`, {
        headers: { authorization: "Bearer secret-token-123" },
      }),
    );
    expect(getRes.status).toBe(404);
  });

  it("returns 401 for invalid token", async () => {
    const res = await app.fetch(
      new Request("http://localhost/api/posts", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: "Bearer invalid-token",
        },
        body: JSON.stringify({
          title: "Test",
          content: "Test",
          author: "test",
        }),
      }),
    );
    expect(res.status).toBe(401);
  });

  it("returns 401 for missing authorization header", async () => {
    const res = await app.fetch(
      new Request("http://localhost/api/posts", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          title: "Test",
          content: "Test",
          author: "test",
        }),
      }),
    );
    expect(res.status).toBe(401);
  });

  it("filters posts by tags", async () => {
    await app.fetch(
      new Request("http://localhost/api/posts", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: "Bearer secret-token-123",
        },
        body: JSON.stringify({
          title: "Tagged post",
          content: "Has intro tag",
          author: "tags-filter",
          tags: ["intro", "hello"],
        }),
      }),
    );

    const res = await app.fetch(
      new Request("http://localhost/api/posts?author=tags-filter&tags=intro", {
        headers: { authorization: "Bearer secret-token-123" },
      }),
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.length).toBe(1);
    expect(data[0].title).toBe("Tagged post");
  });

  it("returns cached post on repeated get", async () => {
    const createRes = await app.fetch(
      new Request("http://localhost/api/posts", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: "Bearer secret-token-123",
        },
        body: JSON.stringify({
          title: "Cache test",
          content: "Will be cached",
          author: "unique-cache-author",
        }),
      }),
    );
    const created = await createRes.json();

    await app.fetch(
      new Request(`http://localhost/api/posts/${created.id}`, {
        headers: { authorization: "Bearer secret-token-123" },
      }),
    );

    const getRes2 = await app.fetch(
      new Request(`http://localhost/api/posts/${created.id}`, {
        headers: { authorization: "Bearer secret-token-123" },
      }),
    );
    expect(getRes2.status).toBe(200);
    const data = await getRes2.json();
    expect(data.id).toBe(created.id);
  });

  it("returns 500 when updating non-existent post", async () => {
    const res = await app.fetch(
      new Request("http://localhost/api/posts/non-existent-id", {
        method: "PUT",
        headers: {
          "content-type": "application/json",
          authorization: "Bearer secret-token-123",
        },
        body: JSON.stringify({ title: "Updated" }),
      }),
    );
    expect(res.status).toBe(500);
  });

  it("creates two posts with same author", async () => {
    const author = "cache-author";
    const makeRequest = () =>
      app.fetch(
        new Request("http://localhost/api/posts", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            authorization: "Bearer secret-token-123",
          },
          body: JSON.stringify({
            title: "Post",
            content: "Content",
            author,
          }),
        }),
      );

    const res1 = await makeRequest();
    expect(res1.status).toBe(201);

    const res2 = await makeRequest();
    expect(res2.status).toBe(201);
    const data = await res2.json();
    expect(data.id).toBeDefined();
    expect(data.title).toBe("Post");
  });
});
