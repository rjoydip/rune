import { RuneApp } from "@rune/core";
import type { Context } from "@rune/core";
import { Module, Controller, Get, Post, Req } from "@rune/decorators";
import { SocketHandler } from "@rune/socket";

const socketHandler = new SocketHandler();

@Controller("/socket")
class SocketController {
  @Req()
  @Get("/status")
  status(_context: Context) {
    return {
      connections: socketHandler.connections,
      message: "Socket handler ready",
    };
  }

  @Req()
  @Post("/broadcast")
  async broadcast(context: Context) {
    const body = (await context.request.json()) as { message?: string };
    const msg = body?.message ?? "default broadcast";
    socketHandler.broadcast(msg);
    return { sent: true, message: msg, recipients: socketHandler.connections };
  }
}

@Module({ controllers: [SocketController], providers: [], imports: [], exports: [] })
class AppModule {}

const app = new RuneApp();
app.registerModule(AppModule);

export { socketHandler };
export default app;
