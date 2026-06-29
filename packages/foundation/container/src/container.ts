import type { IContainer, Registration, Token } from "./types.ts";
import { Scope } from "./types.ts";

/**
 * Concrete dependency injection container supporting singleton,
 * transient, and request-scoped resolutions.
 *
 * @example
 * ```ts
 * const container = new Container();
 * container.register({ token: "db", useValue: db, scope: Scope.Singleton });
 * const db = container.resolve("db");
 * ```
 */
export class Container implements IContainer {
  private readonly registrations: Map<Token, Registration>;
  private readonly parent: Container | null;
  private singletons = new Map<Token, unknown>();
  private readonly requestScope: Map<string, unknown> | null;

  /**
   * @param requestScope - Optional map for request-scoped state.
   */
  constructor(requestScope?: Map<string, unknown>) {
    this.registrations = new Map();
    this.parent = null;
    this.requestScope = requestScope ?? null;
  }

  private initChild(
    parentSingletons: Map<Token, unknown>,
    parentRequestScope: Map<string, unknown> | null,
    parent: Container,
  ): void {
    (this as any).parent = parent;
    (this as any).singletons = parentSingletons;
    (this as any).requestScope = parentRequestScope;
  }

  private findRegistration(token: Token): Registration | undefined {
    let reg = this.registrations.get(token);
    if (reg) return reg;
    if (this.parent) return this.parent.findRegistration(token);
    return undefined;
  }

  /**
   * Register a provider.
   * @param registration - Descriptor with token, implementation, and scope.
   *
   * @example
   * ```ts
   * container.register({
   *   token: Logger,
   *   useClass: ConsoleLogger,
   *   scope: Scope.Singleton,
   * });
   * ```
   */
  register<T>(registration: Registration<T>): void {
    this.registrations.set(registration.token, registration as Registration);
    if (registration.useValue !== undefined) {
      this.singletons.set(registration.token, registration.useValue);
    }
  }

  /**
   * Resolve a token to its registered value, factory, or class instance.
   * @param token - The registration token.
   * @param context - Optional context map for request-scoped resolution.
   * @returns The resolved instance.
   * @throws If no registration is found for the token.
   *
   * @example
   * ```ts
   * const logger = container.resolve<Logger>(Logger);
   * logger.info("Hello");
   * ```
   */
  resolve<T>(token: Token<T>, context?: Map<string, unknown>): T {
    const existing = this.singletons.get(token);
    if (existing !== undefined) return existing as T;

    const registration = this.findRegistration(token);
    if (!registration) {
      throw new Error(`No registration found for token: ${String(token)}`);
    }

    const activeContext = context !== undefined ? context : this.requestScope;

    if (registration.useValue !== undefined) {
      return registration.useValue as T;
    }

    if (registration.useFactory) {
      const instance = registration.useFactory(this);
      if (registration.scope === Scope.Singleton) {
        this.singletons.set(token, instance);
      }
      return instance as T;
    }

    if (registration.useClass) {
      const instance = this.instantiate(
        registration.useClass as new (...args: unknown[]) => T,
        activeContext,
      );
      if (registration.scope === Scope.Singleton) {
        this.singletons.set(token, instance);
      }
      return instance;
    }

    throw new Error(`Invalid registration for token: ${String(token)}`);
  }

  /**
   * Create a child scope that inherits all registrations and singletons
   * from the parent container via prototypal delegation.
   * @returns A new scoped Container instance.
   *
   * @example
   * ```ts
   * const requestContainer = container.createScope();
   * const userService = requestContainer.resolve(UserService);
   * ```
   */
  createScope(): Container {
    const child = new Container();
    child.initChild(this.singletons, this.requestScope, this);
    return child;
  }

  /**
   * Check whether a token has been registered.
   * @param token - The token to check.
   * @returns `true` if a registration exists.
   *
   * @example
   * ```ts
   * if (container.has(Logger)) {
   *   const logger = container.resolve(Logger);
   * }
   * ```
   */
  has(token: Token): boolean {
    return this.findRegistration(token) !== undefined;
  }

  private instantiate<T>(
    Class: new (...args: unknown[]) => T,
    _context?: Map<string, unknown> | null,
  ): T {
    return new Class();
  }
}
