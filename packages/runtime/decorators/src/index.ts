/** Controller and HTTP method decorators (@Controller, @Get, @Post, @Put, @Delete, @Patch). */
export { Controller, Get, Post, Put, Delete, Patch } from "./controller.ts";
/** Parameter injection decorators (@Body, @Param, @Query, @Headers, @Req). */
export { Body, Param, Query, Headers, Req } from "./params.ts";
/** Guard decorator (@UseGuard). */
export { UseGuard } from "./guards.ts";
/** Interceptor decorator (@UseInterceptor). */
export { UseInterceptor } from "./interceptors.ts";
/** Module configuration decorator (@Module). */
export { Module } from "./module.ts";
/** Injectable scope decorator (@Injectable). */
export { Injectable } from "./injectable.ts";
/** Explicit dependency declaration decorator (@Deps). */
export { Deps } from "./deps.ts";
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
} from "./metadata.ts";
/** Metadata type definitions for routes, params, modules, and injectables. */
export type {
  RouteHandlerMetadata,
  ParamMetadata,
  ModuleMetadata,
  InjectableMetadata,
} from "./metadata.ts";
