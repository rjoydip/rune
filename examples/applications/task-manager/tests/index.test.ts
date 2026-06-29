import { describe, it, expect, beforeEach } from "bun:test";
import app, { resetState } from "../index";

describe("task-manager", () => {
  beforeEach(() => {
    resetState();
  });
  it("creates a new task", async () => {
    const res = await app.fetch(
      new Request("http://localhost/api/v1/tasks", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: "Bearer task-manager-secret-key-2024",
        },
        body: JSON.stringify({
          title: "Complete project",
          description: "Finish the blog API",
          status: "todo",
          priority: "high",
          assignee: "alice",
          dueDate: "2024-12-31",
        }),
      }),
    );
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.id).toBeDefined();
    expect(data.title).toBe("Complete project");
    expect(data.status).toBe("todo");
    expect(data.priority).toBe("high");
  });

  it("gets a task by ID", async () => {
    const createRes = await app.fetch(
      new Request("http://localhost/api/v1/tasks", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: "Bearer task-manager-secret-key-2024",
        },
        body: JSON.stringify({
          title: "Task for testing",
          description: "Test task",
          status: "in-progress",
          priority: "medium",
          assignee: "bob",
        }),
      }),
    );
    const created = await createRes.json();

    const getRes = await app.fetch(
      new Request(`http://localhost/api/v1/tasks/${created.id}`, {
        headers: { authorization: "Bearer task-manager-secret-key-2024" },
      }),
    );
    expect(getRes.status).toBe(200);
    const data = await getRes.json();
    expect(data.id).toBe(created.id);
    expect(data.title).toBe("Task for testing");
  });

  it("gets tasks list with filters", async () => {
    const createRes = await app.fetch(
      new Request("http://localhost/api/v1/tasks", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: "Bearer task-manager-secret-key-2024",
        },
        body: JSON.stringify({
          title: "Task for alice",
          description: "Alice's task",
          status: "todo",
          priority: "low",
          assignee: "alice",
        }),
      }),
    );
    await createRes.json();

    const createRes2 = await app.fetch(
      new Request("http://localhost/api/v1/tasks", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: "Bearer task-manager-secret-key-2024",
        },
        body: JSON.stringify({
          title: "Task for bob",
          description: "Bob's task",
          status: "done",
          priority: "high",
          assignee: "bob",
        }),
      }),
    );
    await createRes2.json();

    const getRes = await app.fetch(
      new Request("http://localhost/api/v1/tasks?assignee=alice", {
        headers: { authorization: "Bearer task-manager-secret-key-2024" },
      }),
    );
    expect(getRes.status).toBe(200);
    const data = await getRes.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(1);
    expect(data[0].assignee).toBe("alice");
  });

  it("updates a task", async () => {
    const createRes = await app.fetch(
      new Request("http://localhost/api/v1/tasks", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: "Bearer task-manager-secret-key-2024",
        },
        body: JSON.stringify({
          title: "Original Title",
          description: "Original description",
          status: "todo",
          priority: "low",
          assignee: "charlie",
        }),
      }),
    );
    const created = await createRes.json();

    const updateRes = await app.fetch(
      new Request(`http://localhost/api/v1/tasks/${created.id}`, {
        method: "PUT",
        headers: {
          "content-type": "application/json",
          authorization: "Bearer task-manager-secret-key-2024",
        },
        body: JSON.stringify({
          status: "done",
          priority: "high",
        }),
      }),
    );
    expect(updateRes.status).toBe(200);
    const data = await updateRes.json();
    expect(data.id).toBe(created.id);
    expect(data.status).toBe("done");
    expect(data.priority).toBe("high");
    expect(data.assignee).toBe("charlie");
  });

  it("deletes a task", async () => {
    const createRes = await app.fetch(
      new Request("http://localhost/api/v1/tasks", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: "Bearer task-manager-secret-key-2024",
        },
        body: JSON.stringify({
          title: "To be deleted",
          description: "This will be deleted",
          status: "todo",
          priority: "medium",
          assignee: "dave",
        }),
      }),
    );
    const created = await createRes.json();

    const deleteRes = await app.fetch(
      new Request(`http://localhost/api/v1/tasks/${created.id}`, {
        method: "DELETE",
        headers: { authorization: "Bearer task-manager-secret-key-2024" },
      }),
    );
    expect(deleteRes.status).toBe(200);
    const data = await deleteRes.json();
    expect(data.success).toBe(true);

    const getRes = await app.fetch(
      new Request(`http://localhost/api/v1/tasks/${created.id}`, {
        headers: { authorization: "Bearer task-manager-secret-key-2024" },
      }),
    );
    expect(getRes.status).toBe(404);
  });

  it("adds a comment to a task", async () => {
    const createRes = await app.fetch(
      new Request("http://localhost/api/v1/tasks", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: "Bearer task-manager-secret-key-2024",
        },
        body: JSON.stringify({
          title: "Task with comments",
          description: "This task will have comments",
          status: "todo",
          priority: "low",
          assignee: "eve",
        }),
      }),
    );
    const created = await createRes.json();

    const commentRes = await app.fetch(
      new Request(`http://localhost/api/v1/tasks/${created.id}/comments`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: "Bearer task-manager-secret-key-2024",
        },
        body: JSON.stringify({
          text: "Great work on this task!",
        }),
      }),
    );
    expect(commentRes.status).toBe(200);
    const data = await commentRes.json();
    expect(data.id).toBeDefined();
    expect(data.comments).toHaveLength(1);
    expect(data.comments[0].text).toBe("Great work on this task!");
  });

  it("returns 401 for invalid token", async () => {
    const res = await app.fetch(
      new Request("http://localhost/api/v1/tasks", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: "Bearer invalid-token",
        },
        body: JSON.stringify({
          title: "Test",
          description: "Test",
          status: "todo",
          priority: "low",
          assignee: "test",
        }),
      }),
    );
    expect(res.status).toBe(401);
  });

  it("returns 404 for missing authorization header", async () => {
    const res = await app.fetch(
      new Request("http://localhost/api/v1/tasks", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          title: "Test",
          description: "Test",
          status: "todo",
          priority: "low",
          assignee: "test",
        }),
      }),
    );
    expect(res.status).toBe(401);
  });

  it("gets task from cache on repeated get", async () => {
    const createRes = await app.fetch(
      new Request("http://localhost/api/v1/tasks", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: "Bearer task-manager-secret-key-2024",
        },
        body: JSON.stringify({
          title: "Cache test task",
          description: "Will be cached",
          status: "todo",
          priority: "low",
          assignee: "frank",
        }),
      }),
    );
    const created = await createRes.json();

    await app.fetch(
      new Request(`http://localhost/api/v1/tasks/${created.id}`, {
        headers: { authorization: "Bearer task-manager-secret-key-2024" },
      }),
    );

    const getRes2 = await app.fetch(
      new Request(`http://localhost/api/v1/tasks/${created.id}`, {
        headers: { authorization: "Bearer task-manager-secret-key-2024" },
      }),
    );
    expect(getRes2.status).toBe(200);
    const data = await getRes2.json();
    expect(data.id).toBe(created.id);
  });

  it("filters tasks by status and priority", async () => {
    await app.fetch(
      new Request("http://localhost/api/v1/tasks", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: "Bearer task-manager-secret-key-2024",
        },
        body: JSON.stringify({
          title: "High priority todo",
          status: "todo",
          priority: "high",
          assignee: "grace",
        }),
      }),
    );

    await app.fetch(
      new Request("http://localhost/api/v1/tasks", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: "Bearer task-manager-secret-key-2024",
        },
        body: JSON.stringify({
          title: "Low priority done",
          status: "done",
          priority: "low",
          assignee: "grace",
        }),
      }),
    );

    const res = await app.fetch(
      new Request("http://localhost/api/v1/tasks?assignee=grace&status=todo&priority=high", {
        headers: { authorization: "Bearer task-manager-secret-key-2024" },
      }),
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.length).toBe(1);
    expect(data[0].title).toBe("High priority todo");
  });

  it("filters tasks with limit and offset", async () => {
    await Promise.all(
      Array.from({ length: 5 }, (_, i) =>
        app.fetch(
          new Request("http://localhost/api/v1/tasks", {
            method: "POST",
            headers: {
              "content-type": "application/json",
              authorization: "Bearer task-manager-secret-key-2024",
            },
            body: JSON.stringify({
              title: `Task ${i}`,
              status: "todo",
              priority: "medium",
              assignee: "limit-test",
            }),
          }),
        ),
      ),
    );

    const res = await app.fetch(
      new Request(
        "http://localhost/api/v1/tasks?assignee=limit-test&status=todo&priority=medium&search=&limit=3&offset=1",
        {
          headers: { authorization: "Bearer task-manager-secret-key-2024" },
        },
      ),
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.length).toBe(2);
  });

  it("returns 500 when updating non-existent task", async () => {
    const res = await app.fetch(
      new Request("http://localhost/api/v1/tasks/non-existent-id", {
        method: "PUT",
        headers: {
          "content-type": "application/json",
          authorization: "Bearer task-manager-secret-key-2024",
        },
        body: JSON.stringify({ status: "done" }),
      }),
    );
    expect(res.status).toBe(500);
  });

  it("returns 500 when adding comment to non-existent task", async () => {
    const res = await app.fetch(
      new Request("http://localhost/api/v1/tasks/non-existent-id/comments", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: "Bearer task-manager-secret-key-2024",
        },
        body: JSON.stringify({ text: "Comment on missing task" }),
      }),
    );
    expect(res.status).toBe(500);
  });
});
