import type { DatabaseAdapter } from "./adapter.js";

export interface DatabaseModuleConfig {
  adapter: DatabaseAdapter;
}

export const DATABASE_MODULE_ADAPTER = Symbol("DatabaseModuleAdapter");

/**
 * NestJS-style dynamic module helper for registering a DatabaseAdapter
 * in the DI container. Returns a provider/exports config that consumers
 * can pass to {@link Container.register}.
 *
 * @example
 * ```ts
 * const { providers, exports } = DatabaseModule.forRoot({ adapter });
 * for (const p of providers) container.register(p);
 * ```
 */
export class DatabaseModule {
  static forRoot(config: DatabaseModuleConfig) {
    return {
      providers: [
        {
          provide: DATABASE_MODULE_ADAPTER,
          useValue: config.adapter,
        },
      ],
      exports: [DATABASE_MODULE_ADAPTER],
    };
  }
}
