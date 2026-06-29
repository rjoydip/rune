import { describe, it, expect, beforeEach } from "bun:test";
import app, { resetState, TaskService } from "../index";

describe("task-manager - TaskService", () => {
  beforeEach(() => {
    resetState();
  });

  it("TaskService.getTasks filters by search term", async () => {
    const taskService = app.container.resolve(TaskService);
    await taskService.createTask({
      title: "Complete project",
      description: "Finish the blog API",
      status: "todo",
      priority: "high",
      assignee: "alice",
    });

    await taskService.createTask({
      title: "Write documentation",
      description: "Document the API endpoints",
      status: "in-progress",
      priority: "medium",
      assignee: "bob",
    });

    const tasks = await taskService.getTasks(undefined, undefined, undefined, "project");
    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toBe("Complete project");
    expect(tasks[0].assignee).toBe("alice");
  });

  it("TaskService.getTasks returns all tasks when no search", async () => {
    const taskService = app.container.resolve(TaskService);
    await taskService.createTask({
      title: "Task 1",
      description: "First task",
      status: "todo",
      priority: "low",
      assignee: "alice",
    });

    await taskService.createTask({
      title: "Task 2",
      description: "Second task",
      status: "done",
      priority: "high",
      assignee: "bob",
    });

    const tasks = await taskService.getTasks();
    expect(tasks).toHaveLength(2);
  });

  it("TaskService.getTasks filters by search in title", async () => {
    const taskService = app.container.resolve(TaskService);
    await taskService.createTask({
      title: "Project Alpha",
      description: "Alpha project",
      status: "todo",
      priority: "high",
    });

    await taskService.createTask({
      title: "Project Beta",
      description: "Beta project",
      status: "todo",
      priority: "medium",
    });

    const tasks = await taskService.getTasks(undefined, undefined, undefined, "Alpha");
    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toBe("Project Alpha");
  });

  it("TaskService.getTasks filters by search in description", async () => {
    const taskService = app.container.resolve(TaskService);
    await taskService.createTask({
      title: "Task 1",
      description: "Alpha project",
      status: "todo",
      priority: "high",
    });

    await taskService.createTask({
      title: "Task 2",
      description: "Beta project",
      status: "todo",
      priority: "medium",
    });

    const tasks = await taskService.getTasks(undefined, undefined, undefined, "Beta");
    expect(tasks).toHaveLength(1);
    expect(tasks[0].description).toBe("Beta project");
  });
});
