/**
 * The main dependency injection container.
 */
export { Container } from "./container.ts";

/**
 * Lifetime scopes for registered providers.
 */
export { Scope } from "./types.ts";

/**
 * Core container interface, registration descriptor, and token type.
 */
export type { IContainer, Registration, Token } from "./types.ts";
