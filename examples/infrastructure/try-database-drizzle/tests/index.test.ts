import { describe, it, expect, spyOn } from "bun:test";
import { DrizzleAdapter, type AnyDrizzleDB } from "@rune/database-drizzle";

describe("try-database-drizzle", () => {
  it("implements DatabaseAdapter", () => {
    const client = { $client: { connect() {}, end() {} } } as unknown as AnyDrizzleDB;
    const adapter = new DrizzleAdapter(client);
    expect(typeof adapter.connect).toBe("function");
    expect(typeof adapter.disconnect).toBe("function");
  });

  it("connect calls driver.connect", async () => {
    const driver = { connect() {}, end() {} };
    const connectSpy = spyOn(driver, "connect");
    const client = { $client: driver } as unknown as AnyDrizzleDB;
    const adapter = new DrizzleAdapter(client);
    await adapter.connect();
    expect(connectSpy).toHaveBeenCalled();
  });

  it("disconnect calls driver.end", async () => {
    const driver = { connect() {}, end() {} };
    const endSpy = spyOn(driver, "end");
    const client = { $client: driver } as unknown as AnyDrizzleDB;
    const adapter = new DrizzleAdapter(client);
    await adapter.disconnect();
    expect(endSpy).toHaveBeenCalled();
  });

  it("client property returns the drizzle instance", () => {
    const client = { $client: {} } as unknown as AnyDrizzleDB;
    const adapter = new DrizzleAdapter(client);
    expect(adapter.client).toBe(client);
  });
});
