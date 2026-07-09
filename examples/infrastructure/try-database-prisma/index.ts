import { PrismaAdapter, type AnyPrismaClient } from "@rune/database-prisma";
import type { DatabaseAdapter } from "@rune/database-core";

// Mock PrismaClient
const mockClient = {
  $connect() {},
  $disconnect() {},
} as unknown as AnyPrismaClient;

const adapter = new PrismaAdapter(mockClient);

// Manually exercise the DatabaseAdapter interface
const db: DatabaseAdapter = adapter;

await db.connect();
console.log("Connected to Prisma database");
await db.disconnect();
console.log("Disconnected from Prisma database");
