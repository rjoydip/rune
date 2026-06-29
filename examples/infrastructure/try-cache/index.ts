import { MemoryCache } from "@rune/cache";

const cache = new MemoryCache();

await cache.set("user:1", { name: "Alice" });
const user = await cache.get<{ name: string }>("user:1");
console.log("User:", user);

await cache.set("temp", "will expire", 50);
await cache.delete("temp");
console.log("Exists after delete:", await cache.get("temp"));

await cache.clear();
console.log("All cleared");
