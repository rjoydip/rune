import { bench, run } from "bun:test";
import { SocketHandler } from "@rune/socket";

const handler = new SocketHandler();

bench("SocketHandler add connection", () => {
  const conn = SocketHandler.createConnection(() => {});
  handler.addConnection(conn);
});

bench("SocketHandler broadcast to 1 connection", () => {
  handler.broadcast("hello");
});

bench("SocketHandler broadcast to 10 connections", () => {
  for (let i = 0; i < 10; i++) {
    const conn = SocketHandler.createConnection(() => {});
    handler.addConnection(conn);
  }
  handler.broadcast("hello");
});

const iterations = parseInt(process.env.ITERATIONS || "10000", 10);

console.log(`\nRunning Socket benchmarks (${iterations.toLocaleString()} iterations each)...\n`);

await run({ iterations });
