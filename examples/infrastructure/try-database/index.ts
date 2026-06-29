import type { DatabaseAdapter } from "@rune/database";

class MockDatabase implements DatabaseAdapter {
  private data = new Map<string, unknown>();
  private connected = false;

  async connect(): Promise<void> {
    this.connected = true;
  }
  async disconnect(): Promise<void> {
    this.connected = false;
  }

  async query<T>(sql: string): Promise<T[]> {
    console.log(`Mock query: ${sql}`);
    return Array.from(this.data.values()) as T[];
  }
}

const db = new MockDatabase();
await db.connect();
const results = await db.query<{ id: number }>("SELECT 1");
console.log("Results:", results);
await db.disconnect();
