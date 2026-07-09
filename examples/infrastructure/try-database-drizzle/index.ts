import { DrizzleAdapter, type AnyDrizzleDB } from "@rune/database-drizzle";
import type { DatabaseAdapter } from "@rune/database-core";

// Mock Drizzle client with a connectable driver
const mockDriver = { connect() {}, end() {} };
const mockClient = { $client: mockDriver } as unknown as AnyDrizzleDB;

const adapter = new DrizzleAdapter(mockClient);

// Manually exercise the DatabaseAdapter interface
const db: DatabaseAdapter = adapter;

await db.connect();
console.log("Connected to Drizzle database");
await db.disconnect();
console.log("Disconnected from Drizzle database");
