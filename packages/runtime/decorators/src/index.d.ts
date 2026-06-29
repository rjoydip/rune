// Type declarations for @rune/decorators

export * from "./src/controller";
export * from "./src/params";
export * from "./src/guards";
export * from "./src/interceptors";
export * from "./src/module";
export * from "./src/injectable";
export * from "./src/deps";
export * from "./src/metadata";

// Re-export the types
export type {
  RouteHandlerMetadata,
  ParamMetadata,
  ModuleMetadata,
  InjectableMetadata,
} from "./src/metadata";

// Export the metadata constants
export {
  ROUTE_HANDLERS,
  CONTROLLER_PREFIX,
  MODULE_METADATA,
  INJECTABLE_SCOPE,
  GUARD_METADATA,
  INTERCEPTOR_METADATA,
  PARAM_METADATA,
  DTO_METADATA,
  DEPENDENCY_METADATA,
  getMeta,
  getOwnMeta,
  setMeta,
  deleteMeta,
  keysMeta,
} from "./src/metadata";
