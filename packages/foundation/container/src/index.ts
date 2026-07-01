/**
 * The main dependency injection container.
 */
export { Container } from "./container.js";

/**
 * Lifetime scopes for registered providers.
 */
export { Scope } from "./types.js";

/**
 * Core container interface, registration descriptor, and token type.
 */
export type { IContainer, Registration, Token } from "./types.js";
