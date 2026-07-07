import type { DatabaseAdapter, OnAppInit, OnAppDestroy } from "@rune/database-core";

export interface AnyDrizzleDB {
  $client: unknown;
}

export class DrizzleAdapter<T extends AnyDrizzleDB>
  implements DatabaseAdapter, OnAppInit, OnAppDestroy
{
  readonly client: T;

  constructor(client: T) {
    this.client = client;
  }

  async connect(): Promise<void> {
    const driver = this.client.$client as Record<string, unknown> | undefined;
    if (driver && typeof driver.connect === "function") {
      await driver.connect();
    }
  }

  async disconnect(): Promise<void> {
    const driver = this.client.$client as Record<string, unknown> | undefined;
    if (!driver) return;
    if (typeof driver.end === "function") {
      await driver.end();
    } else if (typeof driver.close === "function") {
      await driver.close();
    }
  }

  async onAppInit(): Promise<void> {
    await this.connect();
  }

  async onAppDestroy(): Promise<void> {
    await this.disconnect();
  }
}
