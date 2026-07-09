import { describe, it, expect, spyOn } from "bun:test";
import { PrismaAdapter } from "../src/index";

describe("PrismaAdapter", () => {
  it("implements DatabaseAdapter", () => {
    const client = { $connect() {}, $disconnect() {} };
    const adapter = new PrismaAdapter(client as any);
    expect(adapter).toBeDefined();
    expect(typeof adapter.connect).toBe("function");
    expect(typeof adapter.disconnect).toBe("function");
  });

  it("connect calls $connect", async () => {
    const client = { $connect() {}, $disconnect() {} };
    const connectSpy = spyOn(client, "$connect");
    const adapter = new PrismaAdapter(client as any);
    await adapter.connect();
    expect(connectSpy).toHaveBeenCalled();
  });

  it("disconnect calls $disconnect", async () => {
    const client = { $connect() {}, $disconnect() {} };
    const disconnectSpy = spyOn(client, "$disconnect");
    const adapter = new PrismaAdapter(client as any);
    await adapter.disconnect();
    expect(disconnectSpy).toHaveBeenCalled();
  });

  it("re-throws $connect errors", async () => {
    const client = {
      $connect() {
        throw new Error("Connection refused");
      },
      $disconnect() {},
    };
    const adapter = new PrismaAdapter(client as any);
    await expect(adapter.connect()).rejects.toThrow("Connection refused");
  });

  it("re-throws $disconnect errors", async () => {
    const client = {
      $connect() {},
      $disconnect() {
        throw new Error("Disconnect failed");
      },
    };
    const adapter = new PrismaAdapter(client as any);
    await expect(adapter.disconnect()).rejects.toThrow("Disconnect failed");
  });

  it("client property returns the PrismaClient instance", () => {
    const client = { $connect() {}, $disconnect() {} };
    const adapter = new PrismaAdapter(client as any);
    expect(adapter.client).toBe(client);
  });

  it("onAppInit calls $connect", async () => {
    const client = { $connect() {}, $disconnect() {} };
    const connectSpy = spyOn(client, "$connect");
    const adapter = new PrismaAdapter(client as any);
    await adapter.onAppInit();
    expect(connectSpy).toHaveBeenCalled();
  });

  it("onAppDestroy calls $disconnect", async () => {
    const client = { $connect() {}, $disconnect() {} };
    const disconnectSpy = spyOn(client, "$disconnect");
    const adapter = new PrismaAdapter(client as any);
    await adapter.onAppDestroy();
    expect(disconnectSpy).toHaveBeenCalled();
  });
});
