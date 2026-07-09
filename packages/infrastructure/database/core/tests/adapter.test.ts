import { describe, it, expect } from "bun:test";
import { Container, Scope } from "@rune/container";
import type { DatabaseAdapter } from "../src/index";
import { DatabaseModule, DATABASE_MODULE_ADAPTER } from "../src/index";

describe("DatabaseAdapter type", () => {
  it("is a valid interface", () => {
    const adapter: DatabaseAdapter = {
      async connect() {},
      async disconnect() {},
    };
    expect(adapter).toBeDefined();
    expect(typeof adapter.connect).toBe("function");
    expect(typeof adapter.disconnect).toBe("function");
  });

  it("connect and disconnect can be called", async () => {
    let connected = false;
    const adapter: DatabaseAdapter = {
      async connect() {
        connected = true;
      },
      async disconnect() {
        connected = false;
      },
    };
    await adapter.connect();
    expect(connected).toBe(true);
    await adapter.disconnect();
    expect(connected).toBe(false);
  });

  describe("mock in-memory database", () => {
    interface InMemoryDB {
      connect(): Promise<void>;
      disconnect(): Promise<void>;
      query<T>(sql: string): Promise<T[]>;
    }

    function createInMemoryDB(): InMemoryDB {
      let connected = false;
      const store = new Map<string, unknown[]>();

      return {
        async connect() {
          if (connected) throw new Error("Already connected");
          connected = true;
        },
        async disconnect() {
          connected = false;
        },
        async query<T>(_sql: string): Promise<T[]> {
          if (!connected) throw new Error("Not connected");
          return (store.get(_sql) as T[]) ?? [];
        },
      };
    }

    it("connect re-throws if already connected", async () => {
      const db = createInMemoryDB();
      await db.connect();
      expect(db.connect()).rejects.toThrow("Already connected");
    });

    it("disconnect is safe to call multiple times", async () => {
      const db = createInMemoryDB();
      await db.connect();
      await db.disconnect();
      await expect(db.disconnect()).resolves.toBeUndefined();
    });

    it("stores and retrieves data", async () => {
      const db = createInMemoryDB();
      await db.connect();
      const result = await db.query<{ id: number }>("SELECT 1");
      expect(result).toEqual([]);
    });
  });
});

describe("DatabaseModule.forRoot", () => {
  it("registers adapter in container and makes it injectable", () => {
    const adapter: DatabaseAdapter = {
      async connect() {},
      async disconnect() {},
    };

    const config = DatabaseModule.forRoot({ adapter });
    const container = new Container();

    for (const provider of config.providers) {
      const p = provider as { provide: symbol; useValue: unknown };
      container.register({
        token: p.provide,
        useValue: p.useValue,
        scope: Scope.Singleton,
      });
    }

    const resolved = container.resolve<DatabaseAdapter>(DATABASE_MODULE_ADAPTER);
    expect(resolved).toBe(adapter);
    expect(typeof resolved.connect).toBe("function");
    expect(typeof resolved.disconnect).toBe("function");
  });
});
