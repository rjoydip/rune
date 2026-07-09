import { describe, it, expect, spyOn } from "bun:test";
import { DrizzleAdapter } from "../src/index";

describe("DrizzleAdapter", () => {
  it("implements DatabaseAdapter", () => {
    const adapter = new DrizzleAdapter({} as any);
    expect(adapter).toBeDefined();
    expect(typeof adapter.connect).toBe("function");
    expect(typeof adapter.disconnect).toBe("function");
  });

  it("connect calls driver.connect when available", async () => {
    const driver = { connect() {} };
    const drizzle = { $client: driver };
    const connectSpy = spyOn(driver, "connect");
    const adapter = new DrizzleAdapter(drizzle as any);
    await adapter.connect();
    expect(connectSpy).toHaveBeenCalled();
  });

  it("connect is a no-op when driver has no connect method", async () => {
    const driver = {};
    const drizzle = { $client: driver };
    const adapter = new DrizzleAdapter(drizzle as any);
    await expect(adapter.connect()).resolves.toBeUndefined();
  });

  it("disconnect calls driver.end when available", async () => {
    const driver = { end() {} };
    const drizzle = { $client: driver };
    const endSpy = spyOn(driver, "end");
    const adapter = new DrizzleAdapter(drizzle as any);
    await adapter.disconnect();
    expect(endSpy).toHaveBeenCalled();
  });

  it("disconnect calls driver.close when end is not available", async () => {
    const driver = { close() {} };
    const drizzle = { $client: driver };
    const closeSpy = spyOn(driver, "close");
    const adapter = new DrizzleAdapter(drizzle as any);
    await adapter.disconnect();
    expect(closeSpy).toHaveBeenCalled();
  });

  it("disconnect prefers driver.end over driver.close", async () => {
    const driver = { end() {}, close() {} };
    const drizzle = { $client: driver };
    const endSpy = spyOn(driver, "end");
    const closeSpy = spyOn(driver, "close");
    const adapter = new DrizzleAdapter(drizzle as any);
    await adapter.disconnect();
    expect(endSpy).toHaveBeenCalled();
    expect(closeSpy).not.toHaveBeenCalled();
  });

  it("disconnect is a no-op when driver has no end or close", async () => {
    const driver = {};
    const drizzle = { $client: driver };
    const adapter = new DrizzleAdapter(drizzle as any);
    await expect(adapter.disconnect()).resolves.toBeUndefined();
  });

  it("client property returns the drizzle instance", () => {
    const drizzle = { $client: { connect() {} } };
    const adapter = new DrizzleAdapter(drizzle as any);
    expect(adapter.client).toBe(drizzle);
  });

  it("connect is a no-op when $client is undefined", async () => {
    const drizzle = {}; // no $client property
    const adapter = new DrizzleAdapter(drizzle as any);
    await expect(adapter.connect()).resolves.toBeUndefined();
  });

  it("disconnect is a no-op when $client is undefined", async () => {
    const drizzle = {}; // no $client property
    const adapter = new DrizzleAdapter(drizzle as any);
    await expect(adapter.disconnect()).resolves.toBeUndefined();
  });

  it("onAppInit calls connect", async () => {
    const driver = { connect() {} };
    const drizzle = { $client: driver };
    const connectSpy = spyOn(driver, "connect");
    const adapter = new DrizzleAdapter(drizzle as any);
    await adapter.onAppInit();
    expect(connectSpy).toHaveBeenCalled();
  });

  it("onAppDestroy calls disconnect", async () => {
    const driver = { end() {} };
    const drizzle = { $client: driver };
    const endSpy = spyOn(driver, "end");
    const adapter = new DrizzleAdapter(drizzle as any);
    await adapter.onAppDestroy();
    expect(endSpy).toHaveBeenCalled();
  });
});
