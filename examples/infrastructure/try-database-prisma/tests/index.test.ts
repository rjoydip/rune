import { describe, it, expect, spyOn } from "bun:test";
import { PrismaAdapter, type AnyPrismaClient } from "@rune/database-prisma";

describe("try-database-prisma", () => {
  it("implements DatabaseAdapter", () => {
    const client = { $connect() {}, $disconnect() {} } as unknown as AnyPrismaClient;
    const adapter = new PrismaAdapter(client);
    expect(typeof adapter.connect).toBe("function");
    expect(typeof adapter.disconnect).toBe("function");
  });

  it("connect calls $connect", async () => {
    const client = { $connect() {}, $disconnect() {} } as unknown as AnyPrismaClient;
    const connectSpy = spyOn(client, "$connect");
    const adapter = new PrismaAdapter(client);
    await adapter.connect();
    expect(connectSpy).toHaveBeenCalled();
  });

  it("disconnect calls $disconnect", async () => {
    const client = { $connect() {}, $disconnect() {} } as unknown as AnyPrismaClient;
    const disconnectSpy = spyOn(client, "$disconnect");
    const adapter = new PrismaAdapter(client);
    await adapter.disconnect();
    expect(disconnectSpy).toHaveBeenCalled();
  });

  it("client property returns the PrismaClient instance", () => {
    const client = { $connect() {}, $disconnect() {} } as unknown as AnyPrismaClient;
    const adapter = new PrismaAdapter(client);
    expect(adapter.client).toBe(client);
  });
});
