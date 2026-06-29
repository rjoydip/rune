import { createApp, Context, NextFunction } from "@rune/core";
import { Module, Controller, Get, Post, Body, Param, Deps } from "@rune/decorators";
import { MemoryCache } from "@rune/cache";
import { ConsoleLogger } from "@rune/logger";
import { NoopTelemetry } from "@rune/telemetry";
import { MemoryEventBus } from "@rune/events";

class CreateRoomDto {
  name!: string;
  description!: string;
}

class SendMessageDto {
  text!: string;
}

class RoomService {
  private rooms = new Map<string, any>();

  async createRoom(data: CreateRoomDto): Promise<any> {
    const id = `room-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const room = {
      id,
      ...data,
      createdAt: new Date().toISOString(),
    };
    this.rooms.set(id, room);
    return room;
  }

  async getRoom(id: string): Promise<any> {
    return this.rooms.get(id) || null;
  }

  async getRooms(): Promise<any[]> {
    return Array.from(this.rooms.values());
  }

  clearRooms(): void {
    this.rooms.clear();
  }
}

@Deps(MemoryEventBus)
class MessageService {
  private messages = new Map<string, any[]>();

  constructor(private eventBus: MemoryEventBus) {}

  async sendMessage(roomId: string, text: string, userId: string): Promise<any> {
    if (!this.messages.has(roomId)) {
      this.messages.set(roomId, []);
    }
    const message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      roomId,
      text,
      userId,
      createdAt: new Date().toISOString(),
    };
    this.messages.get(roomId)!.push(message);
    await this.eventBus.emit("message.sent", message);
    return message;
  }

  async getMessages(roomId: string): Promise<any[]> {
    return this.messages.get(roomId) || [];
  }

  clearMessages(): void {
    this.messages.clear();
  }
}

class AuthMiddleware {
  private readonly token = "chat-secret-token-2024";

  async use(ctx: Context, next: NextFunction): Promise<void> {
    const authHeader = ctx.request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      ctx.send({ error: "Authentication required" }, 401);
      return;
    }
    const token = authHeader.substring(7);
    if (token !== this.token) {
      ctx.send({ error: "Invalid authentication token" }, 401);
      return;
    }
    ctx.state.set("user", { id: "user-123", role: "admin" });
    await next();
  }
}

@Deps(RoomService, MemoryCache, ConsoleLogger, NoopTelemetry)
@Controller("/api/v1")
class RoomController {
  constructor(
    private roomService: RoomService,
    private cache: MemoryCache,
    private logger: ConsoleLogger,
    private telemetry: NoopTelemetry,
  ) {}

  @Post("/rooms")
  @Body(CreateRoomDto)
  async createRoom(body: CreateRoomDto): Promise<Response> {
    const span = this.telemetry.startSpan("createRoom", { name: body.name });
    try {
      const room = await this.roomService.createRoom(body);
      await this.cache.set(`room:${room.id}`, room, 300);
      this.logger.info("Room created", { id: room.id, name: room.name });
      span.setAttribute("room.id", room.id);
      span.end();
      return new Response(JSON.stringify(room), {
        status: 201,
        headers: { "content-type": "application/json" },
      });
    } catch (error) {
      span.setStatus({ code: 2, message: error instanceof Error ? error.message : String(error) });
      span.end();
      throw error;
    }
  }

  @Get("/rooms/:id")
  @Param()
  async getRoom(id: string): Promise<Response> {
    const span = this.telemetry.startSpan("getRoom", { roomId: id });
    try {
      let room = await this.cache.get<any>(`room:${id}`);
      if (!room) {
        room = await this.roomService.getRoom(id);
        if (!room) {
          return new Response("Not Found", { status: 404 });
        }
        await this.cache.set(`room:${id}`, room, 300);
      }
      span.setAttribute("room.id", id);
      span.end();
      return new Response(JSON.stringify(room), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    } catch (error) {
      span.setStatus({ code: 2, message: error instanceof Error ? error.message : String(error) });
      span.end();
      throw error;
    }
  }

  @Get("/rooms")
  async getRooms(): Promise<Response> {
    const span = this.telemetry.startSpan("getRooms", {});
    try {
      const rooms = await this.roomService.getRooms();
      span.setAttribute("room.count", rooms.length);
      span.end();
      return new Response(JSON.stringify(rooms), {
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

@Deps(MessageService, RoomService, MemoryCache, ConsoleLogger, NoopTelemetry)
@Controller("/api/v1")
class MessageController {
  constructor(
    private messageService: MessageService,
    private roomService: RoomService,
    private cache: MemoryCache,
    private logger: ConsoleLogger,
    private telemetry: NoopTelemetry,
  ) {}

  @Post("/rooms/:roomId/messages")
  @Param()
  @Body(SendMessageDto)
  async sendMessage(roomId: string, body: SendMessageDto): Promise<Response> {
    const span = this.telemetry.startSpan("sendMessage", { roomId });
    try {
      const room = await this.roomService.getRoom(roomId);
      if (!room) {
        return new Response("Not Found", { status: 404 });
      }
      const message = await this.messageService.sendMessage(roomId, body.text, "user-123");
      await this.cache.delete(`messages:${roomId}`);
      this.logger.info("Message sent", { roomId, messageId: message.id });
      span.setAttribute("message.id", message.id);
      span.setAttribute("message.roomId", roomId);
      span.end();
      return new Response(JSON.stringify(message), {
        status: 201,
        headers: { "content-type": "application/json" },
      });
    } catch (error) {
      span.setStatus({ code: 2, message: error instanceof Error ? error.message : String(error) });
      span.end();
      throw error;
    }
  }

  @Get("/rooms/:roomId/messages")
  @Param()
  async getMessages(roomId: string): Promise<Response> {
    const span = this.telemetry.startSpan("getMessages", { roomId });
    try {
      const room = await this.roomService.getRoom(roomId);
      if (!room) {
        return new Response("Not Found", { status: 404 });
      }
      const cacheKey = `messages:${roomId}`;
      let messages = await this.cache.get<any[]>(cacheKey);
      if (!messages) {
        messages = await this.messageService.getMessages(roomId);
        await this.cache.set(cacheKey, messages, 60);
      }
      span.setAttribute("message.count", messages.length);
      span.end();
      return new Response(JSON.stringify(messages), {
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
  controllers: [RoomController, MessageController],
  providers: [
    AuthMiddleware,
    RoomService,
    MessageService,
    MemoryEventBus,
    MemoryCache,
    ConsoleLogger,
    NoopTelemetry,
  ],
  imports: [],
  exports: [],
})
class ChatModule {}

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

app.registerModule(ChatModule);

export function resetState() {
  const roomService = app.container.resolve(RoomService);
  const messageService = app.container.resolve(MessageService);
  roomService.clearRooms();
  messageService.clearMessages();
}

export default app;
