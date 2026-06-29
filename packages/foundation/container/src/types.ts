/**
 * A token used to identify a provider in the DI container. Can be a
 * string, a symbol, or a constructor function.
 */
export type Token<T = unknown> = string | symbol | (new (...args: any[]) => T);

/**
 * Lifetime scopes for registered providers.
 */
export enum Scope {
  /** A single instance is created and reused across the entire application. */
  Singleton = "singleton",
  /** A new instance is created every time the provider is resolved. */
  Transient = "transient",
  /** A new instance is created per HTTP request. */
  Request = "request",
}

/**
 * Describes how a provider should be registered in the container.
 */
export interface Registration<T = unknown> {
  /** The unique identifier for this provider. */
  token: Token<T>;
  /** A constructor to instantiate when resolved. */
  useClass?: new (...args: any[]) => T;
  /** A pre-built value to return directly. */
  useValue?: T;
  /** A factory function that receives the container and returns an instance. */
  useFactory?: (container: IContainer) => T;
  /** The lifetime scope (singleton, transient, or request). */
  scope: Scope;
}

/**
 * Interface for the dependency injection container.
 *
 * @example
 * ```ts
 * class MyContainer implements IContainer {
 *   register<T>(registration: Registration<T>): void { /* ... *\/ }
 *   resolve<T>(token: Token<T>): T { /* ... *\/ }
 *   createScope(): IContainer { return this; }
 *   has(token: Token): boolean { return false; }
 * }
 * ```
 */
export interface IContainer {
  /**
   * Register a provider.
   * @param registration - The provider descriptor.
   *
   * @example
   * ```ts
   * container.register({ token: "config", useValue: { port: 3000 }, scope: Scope.Singleton });
   * ```
   */
  register<T>(registration: Registration<T>): void;

  /**
   * Resolve a token to its registered instance.
   * @param token - The provider token.
   * @param context - Optional request-scoped context map.
   * @returns The resolved instance.
   *
   * @example
   * ```ts
   * const config = container.resolve<AppConfig>("config");
   * console.log(config.port);
   * ```
   */
  resolve<T>(token: Token<T>, context?: Map<string, unknown>): T;

  /**
   * Create a child scope that inherits all registrations.
   * @returns A new scoped container.
   *
   * @example
   * ```ts
   * const child = parent.createScope();
   * const svc = child.resolve(MyService);
   * ```
   */
  createScope(): IContainer;

  /**
   * Check if a token is registered.
   * @param token - The token to check.
   * @returns `true` if registered.
   *
   * @example
   * ```ts
   * if (!container.has("db")) {
   *   container.register({ token: "db", useValue: createDb(), scope: Scope.Singleton });
   * }
   * ```
   */
  has(token: Token): boolean;
}
