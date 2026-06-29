import { MemoryEventBus } from "@rune/events";
import { measure, printResults } from "./measure";

async function main() {
  const bus = new MemoryEventBus();

  await bus.on("test.event", async () => {});

  await bus.emit("test.event", { data: 1 });

  const results = [];

  results.push(
    await measure(
      "event-bus emit + handle",
      async () => {
        await bus.emit("test.event", { data: 1 });
      },
      50_000,
    ),
  );

  results.push(
    await measure(
      "event-bus emit (no listeners)",
      async () => {
        await bus.emit("noop.event", { data: 1 });
      },
      50_000,
    ),
  );

  printResults(results);
  process.exit(0);
}

main();
