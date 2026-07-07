import type { DatabaseAdapter } from "./adapter.js";

export interface DatabaseModuleConfig {
  adapter: DatabaseAdapter;
}

const DATABASE_MODULE_ADAPTER = Symbol("DatabaseModuleAdapter");

export class DatabaseModule {
  static forRoot(config: DatabaseModuleConfig) {
    return {
      module: DatabaseModule,
      providers: [
        {
          provide: DATABASE_MODULE_ADAPTER,
          useValue: config.adapter,
        },
      ],
      exports: [],
    };
  }
}
