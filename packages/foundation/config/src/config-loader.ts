/**
 * Loads configuration from environment variables and provides typed
 * access via `get` / `set`. Values are automatically parsed from
 * strings into numbers, booleans, null, or undefined.
 *
 * @example
 * ```ts
 * const config = new ConfigLoader();
 * const port = config.get<number>("PORT", 3000);
 * ```
 */
export class ConfigLoader {
  private readonly store = new Map<string, unknown>();

  /** Populates the store from `process.env` on instantiation. */
  constructor() {
    this.loadFromEnv();
  }

  /**
   * Retrieve a configuration value by key.
   * @param key - The configuration key.
   * @param defaultValue - Fallback if the key is not set.
   * @returns The parsed value or the default.
   *
   * @example
   * ```ts
   * const dbUrl = config.get<string>("DATABASE_URL");
   * const debug = config.get<boolean>("DEBUG", false);
   * ```
   */
  get<T = string>(key: string, defaultValue?: T): T | undefined {
    const value = this.store.get(key);
    return value !== undefined ? (value as T) : defaultValue;
  }

  /**
   * Set a configuration value. Strings are auto-parsed except for
   * the key `"PORT"`.
   * @param key - The configuration key.
   * @param value - The value to store.
   *
   * @example
   * ```ts
   * config.set("MAX_CONNECTIONS", "100");
   * // Stored as number 100
   * config.set("PORT", "8080");
   * // Stored as string "8080" (key is "PORT")
   * ```
   */
  set(key: string, value: unknown): void {
    this.store.set(
      key,
      typeof value === "string" && key !== "PORT" ? this.parseValue(value) : value,
    );
  }

  private loadFromEnv(): void {
    if (typeof process !== "undefined" && process.env) {
      for (const [key, value] of Object.entries(process.env)) {
        if (value !== undefined) {
          this.store.set(key, this.parseValue(value));
        }
      }
    }
  }

  private parseValue(value: string): unknown {
    if (value === "true") return true;
    if (value === "false") return false;
    if (value === "null") return null;
    if (value === "undefined") return undefined;
    const num = Number(value);
    if (!Number.isNaN(num) && value.trim() !== "") return num;
    return value;
  }
}
