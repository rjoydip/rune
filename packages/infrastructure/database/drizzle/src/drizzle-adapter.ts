import type { DatabaseAdapter, OnAppInit, OnAppDestroy } from "@rune/database-core";

interface DriverClient {
  connect?(): Promise<void> | void;
  end?(): Promise<void> | void;
  close?(): Promise<void> | void;
}

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
    const driver = this.client.$client as DriverClient | undefined;
    if (driver?.connect) {
      await driver.connect();
    }
  }

  async disconnect(): Promise<void> {
    const driver = this.client.$client as DriverClient | undefined;
    if (!driver) return;
    // Prefer end() over close(): bun:sqlite, better-sqlite3 use end();
    // libsql, sql.js use close(). Some drivers support both.
    if (driver.end) {
      await driver.end();
    } else if (driver.close) {
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
