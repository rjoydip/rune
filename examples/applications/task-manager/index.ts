import { createApp, Context, NextFunction } from "@rune/core";
import {
  Module,
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Deps,
} from "@rune/decorators";
import { MemoryCache } from "@rune/cache";
import { ConsoleLogger } from "@rune/logger";
import { NoopTelemetry } from "@rune/telemetry";
import { ValidationPipe } from "@rune/validation";

// DTOs
class CreateTaskDto {
  title!: string;
  description?: string;
  status!: "todo" | "in-progress" | "done";
  priority!: "low" | "medium" | "high";
  assignee?: string;
  dueDate?: string;
}

class UpdateTaskDto {
  title?: string;
  description?: string;
  status?: "todo" | "in-progress" | "done";
  priority?: "low" | "medium" | "high";
  assignee?: string;
  dueDate?: string;
}

class AuthMiddleware {
  private readonly jwtSecret = "task-manager-secret-key-2024";

  async use(ctx: Context, next: NextFunction): Promise<void> {
    const authHeader = ctx.request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      ctx.send({ error: "Authentication required" }, 401);
      return;
    }

    const token = authHeader.substring(7);
    if (token !== this.jwtSecret) {
      ctx.send({ error: "Invalid authentication token" }, 401);
      return;
    }

    ctx.state.set("user", { id: "user-123", role: "admin" });
    await next();
  }
}

class TaskService {
  private tasks = new Map<string, any>();

  async createTask(data: CreateTaskDto): Promise<any> {
    const id = `task-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const task = {
      id,
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      comments: [],
    };
    this.tasks.set(id, task);
    return task;
  }

  async getTask(id: string): Promise<any> {
    const task = this.tasks.get(id);
    if (!task) {
      return null;
    }
    return task;
  }

  async getTasks(
    assignee?: string,
    status?: string,
    priority?: string,
    search?: string,
    limit?: number,
    offset?: number,
  ): Promise<any[]> {
    let tasks = Array.from(this.tasks.values());

    if (assignee) {
      tasks = tasks.filter((t) => t.assignee === assignee);
    }

    if (status) {
      tasks = tasks.filter((t) => t.status === status);
    }

    if (priority) {
      tasks = tasks.filter((t) => t.priority === priority);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      tasks = tasks.filter(
        (t) =>
          t.title.toLowerCase().includes(searchLower) ||
          (t.description && t.description.toLowerCase().includes(searchLower)),
      );
    }

    if (limit !== undefined) {
      tasks = tasks.slice(0, limit);
    }

    if (offset !== undefined) {
      tasks = tasks.slice(offset);
    }

    return tasks;
  }

  async updateTask(id: string, data: UpdateTaskDto): Promise<any> {
    const task = this.tasks.get(id);
    if (!task) {
      throw new Error("Task not found");
    }

    const updates = Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined));

    const updatedTask = {
      ...task,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.tasks.set(id, updatedTask);
    return updatedTask;
  }

  async deleteTask(id: string): Promise<boolean> {
    return this.tasks.delete(id);
  }

  clearTasks(): void {
    this.tasks.clear();
  }

  async addComment(taskId: string, comment: string, userId: string): Promise<any> {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error("Task not found");
    }

    const newComment = {
      id: `comment-${Date.now()}`,
      text: comment,
      userId,
      createdAt: new Date().toISOString(),
    };

    task.comments.push(newComment);
    task.updatedAt = new Date().toISOString();
    this.tasks.set(taskId, task);

    return task;
  }
}

@Deps(TaskService, MemoryCache, ConsoleLogger, NoopTelemetry)
@Controller("/api/v1")
class TaskController {
  constructor(
    private taskService: TaskService,
    private cache: MemoryCache,
    private logger: ConsoleLogger,
    private telemetry: NoopTelemetry,
  ) {}

  @Post("/tasks")
  @Body(CreateTaskDto)
  async createTask(body: CreateTaskDto): Promise<Response> {
    const span = this.telemetry.startSpan("createTask", { assignee: body.assignee });

    try {
      const cacheKey = `tasks:list:assignee=${body.assignee || "all"}`;
      const cached = await this.cache.get<any[]>(cacheKey);

      if (cached) {
        this.logger.info("Returning cached tasks list");
      }

      const task = await this.taskService.createTask(body);
      await this.cache.set(`task:${task.id}`, task, 300);
      await this.cache.delete(cacheKey);

      this.logger.info("Task created", { id: task.id, assignee: task.assignee });
      span.setAttribute("task.id", task.id);
      span.setAttribute("task.assignee", task.assignee);
      span.end();

      return new Response(JSON.stringify(task), {
        status: 201,
        headers: { "content-type": "application/json" },
      });
    } catch (error) {
      span.setStatus({ code: 2, message: error instanceof Error ? error.message : String(error) });
      span.end();
      throw error;
    }
  }

  @Get("/tasks/:id")
  @Param()
  async getTask(id: string): Promise<Response> {
    const span = this.telemetry.startSpan("getTask", { taskId: id });

    try {
      const cacheKey = `task:${id}`;
      let task = await this.cache.get<any>(cacheKey);

      if (!task) {
        task = await this.taskService.getTask(id);
        if (!task) {
          return new Response("Not Found", { status: 404 });
        }
        await this.cache.set(cacheKey, task, 300);
        this.logger.info("Task fetched from service and cached", { id });
      } else {
        this.logger.info("Task fetched from cache", { id });
      }

      span.setAttribute("task.id", id);
      span.end();

      return new Response(JSON.stringify(task), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    } catch (error) {
      span.setStatus({ code: 2, message: error instanceof Error ? error.message : String(error) });
      span.end();
      throw error;
    }
  }

  @Get("/tasks")
  @Query()
  @Query()
  @Query()
  @Query()
  @Query()
  @Query()
  async getTasks(
    assignee?: string,
    status?: string,
    priority?: string,
    search?: string,
    limit?: string,
    offset?: string,
  ): Promise<Response> {
    const span = this.telemetry.startSpan("getTasks", { assignee, status, priority });

    try {
      const cacheKey = `tasks:list:assignee=${assignee || "all"}:status=${status || "all"}:priority=${priority || "all"}:search=${search || "none"}`;
      let tasks = await this.cache.get<any[]>(cacheKey);

      if (!tasks) {
        const limitNum = limit ? parseInt(limit, 10) : undefined;
        const offsetNum = offset ? parseInt(offset, 10) : undefined;

        tasks = await this.taskService.getTasks(
          assignee,
          status,
          priority,
          search,
          limitNum,
          offsetNum,
        );
        await this.cache.set(cacheKey, tasks, 60);
        this.logger.info("Tasks list fetched from service and cached", {
          assignee,
          status,
          priority,
        });
      } else {
        this.logger.info("Tasks list fetched from cache", { assignee, status, priority });
      }

      span.setAttribute("task.count", tasks.length);
      span.end();

      return new Response(JSON.stringify(tasks), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    } catch (error) {
      span.setStatus({ code: 2, message: error instanceof Error ? error.message : String(error) });
      span.end();
      throw error;
    }
  }

  @Put("/tasks/:id")
  @Param()
  @Body(UpdateTaskDto)
  async updateTask(id: string, body: UpdateTaskDto): Promise<Response> {
    const span = this.telemetry.startSpan("updateTask", { taskId: id });

    try {
      const task = await this.taskService.updateTask(id, body);

      await this.cache.set(`task:${task.id}`, task, 300);
      await this.cache.delete("tasks:list:*");

      this.logger.info("Task updated", { id });
      span.setAttribute("task.id", id);
      span.end();

      return new Response(JSON.stringify(task), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    } catch (error) {
      span.setStatus({ code: 2, message: error instanceof Error ? error.message : String(error) });
      span.end();
      throw error;
    }
  }

  @Delete("/tasks/:id")
  @Param()
  async deleteTask(id: string): Promise<Response> {
    const span = this.telemetry.startSpan("deleteTask", { taskId: id });

    try {
      const success = await this.taskService.deleteTask(id);

      await this.cache.delete(`task:${id}`);
      await this.cache.delete("tasks:list:*");

      this.logger.info("Task deleted", { id });
      span.setAttribute("task.id", id);
      span.end();

      return new Response(JSON.stringify({ success }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    } catch (error) {
      span.setStatus({ code: 2, message: error instanceof Error ? error.message : String(error) });
      span.end();
      throw error;
    }
  }

  @Post("/tasks/:id/comments")
  @Param()
  @Body()
  async addComment(id: string, body: { text: string }): Promise<Response> {
    const span = this.telemetry.startSpan("addComment", { taskId: id });

    try {
      const task = await this.taskService.addComment(id, body.text, "user-123");

      await this.cache.set(`task:${task.id}`, task, 300);

      this.logger.info("Comment added", {
        taskId: id,
        commentId: task.comments[task.comments.length - 1].id,
      });
      span.setAttribute("task.id", id);
      span.end();

      return new Response(JSON.stringify(task), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    } catch (error) {
      span.setStatus({ code: 2, message: error instanceof Error ? error.message : String(error) });
      span.end();
      throw error;
    }
  }
}

@Module({
  controllers: [TaskController],
  providers: [
    AuthMiddleware,
    TaskService,
    MemoryCache,
    ConsoleLogger,
    NoopTelemetry,
    ValidationPipe,
  ],
  imports: [],
  exports: [],
})
class TaskModule {}

const app = createApp();

const authMiddleware = new AuthMiddleware();
app.use(async (ctx: Context, next: NextFunction) => {
  await authMiddleware.use(ctx, next);
});

app.use(async (ctx: Context, next: NextFunction) => {
  console.log(`${ctx.request.method} ${ctx.request.url}`);
  await next();
});

app.use(async (ctx: Context, next: NextFunction) => {
  const start = Date.now();
  await next();
  const duration = Date.now() - start;
  console.log(`Request completed in ${duration}ms`);
});

app.registerModule(TaskModule);

export function resetState() {
  const taskService = app.container.resolve(TaskService);
  taskService.clearTasks();
}

export { TaskService };

export default app;
