import type { DatabaseAdapter, OnAppInit, OnAppDestroy } from "@rune/database-core";

export interface AnyPrismaClient {
  $connect(): Promise<void>;
  $disconnect(): Promise<void>;
}

export class PrismaAdapter<T extends AnyPrismaClient>
  implements DatabaseAdapter, OnAppInit, OnAppDestroy
{
  readonly client: T;

  constructor(client: T) {
    this.client = client;
  }

  async connect(): Promise<void> {
    await this.client.$connect();
  }

  async disconnect(): Promise<void> {
    await this.client.$disconnect();
  }

  async onAppInit(): Promise<void> {
    await this.connect();
  }

  async onAppDestroy(): Promise<void> {
    await this.disconnect();
  }
}
