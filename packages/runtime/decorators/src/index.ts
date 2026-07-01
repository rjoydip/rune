/** Controller and HTTP method decorators (@Controller, @Get, @Post, @Put, @Delete, @Patch). */
export { Controller, Get, Post, Put, Delete, Patch } from "./controller.js";
/** Parameter injection decorators (@Body, @Param, @Query, @Headers, @Req). */
export { Body, Param, Query, Headers, Req } from "./params.js";
/** Guard decorator (@UseGuard). */
export { UseGuard } from "./guards.js";
/** Interceptor decorator (@UseInterceptor). */
export { UseInterceptor } from "./interceptors.js";
/** Module configuration decorator (@Module). */
export { Module } from "./module.js";
/** Injectable scope decorator (@Injectable). */
export { Injectable } from "./injectable.js";
/** Explicit dependency declaration decorator (@Deps). */
export { Deps } from "./deps.js";
/** Metadata key constants used across the decorator system. */
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
} from "./metadata.js";
/** Metadata type definitions for routes, params, modules, and injectables. */
export type {
  RouteHandlerMetadata,
  ParamMetadata,
  ModuleMetadata,
  InjectableMetadata,
} from "./metadata.js";
