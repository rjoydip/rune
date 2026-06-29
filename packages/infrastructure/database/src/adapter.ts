/**
 * Database connection adapter interface.
 * Provides a generic contract for connecting to and disconnecting from a database.
 */
export interface DatabaseAdapter {
  /**
   * Establish a connection to the database.
   *
   * @example
   * ```ts
   * await db.connect();
   * ```
   */
  connect(): Promise<void>;

  /**
   * Close the database connection gracefully.
   *
   * @example
   * ```ts
   * await db.disconnect();
   * ```
   */
  disconnect(): Promise<void>;
}
