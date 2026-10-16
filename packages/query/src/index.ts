import type {
  StringMetadataField,
  IntMetadataField,
  DateTimeMetadataField,
  DurationMetadataField,
  JsonMetadataField,
  ListMetadataField,
  LongMetadataField,
  Maybe,
} from "./gql-generated";

// Public query API. This is the stable facade; plugin authors and apps must
// import query primitives from here, never from @tanstack/react-query directly.
// Swapping the query implementation later stays a contained change inside this
// package. See packages/query/README.md ("Stability contract").
export {
  useQuery,
  useQueries,
  useSuspenseQuery,
  useInfiniteQuery,
  useQueryClient,
  useMutation,
} from "@tanstack/react-query";
export type {
  QueryClient,
  InfiniteData,
  FetchNextPageOptions,
  InfiniteQueryObserverResult,
  UseQueryOptions,
  UseQueryResult,
  UseSuspenseQueryOptions,
  UseSuspenseQueryResult,
  UseMutationOptions,
  UseMutationResult,
} from "@tanstack/react-query";
export { gql } from "graphql-request";

export * from "./QueryProvider";
export * from "./hooks";
export * from "./config";

export * from "./client";
export * from "./gql-generated";
export * from "./sortableFields";

// The generator (typescript-operations >= 6) no longer exports these helper
// types; `Exact` is still emitted but kept internal. Hand-written copies keep
// the public surface intact for one deprecation cycle.
/** @deprecated Internal codegen helper, no longer generated. Write the mapped type inline. Removed in the next major. */
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
/** @deprecated Internal codegen helper, no longer generated. Use `Omit<T, K> & { [P in K]?: T[P] | null }`. Removed in the next major. */
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
/** @deprecated Internal codegen helper, no longer generated. Use `Omit<T, K> & { [P in K]: T[P] | null }`. Removed in the next major. */
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
/** @deprecated Internal codegen helper, no longer generated. Use `{ [P in K]?: never }`. Removed in the next major. */
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };

// Explicitly re-export commonly used types for Vite/Rollup compatibility
// when using 'import type' syntax
export type {
  MuiEventsDataFragment,
  MuiGetEventByIdInputFieldsQuery,
  MuiGetInputFieldsMetaDataFragment,
  CommonEventMetadataV2,
  MuiGetSeriesByIdInputFieldsQuery,
  MuiSeriesDataFragment,
  MuiGetMySeriesNameAndIdQuery,
} from "./gql-generated";

export type MetadataFieldType =
  | StringMetadataField
  | IntMetadataField
  | DateTimeMetadataField
  | DurationMetadataField
  | JsonMetadataField
  | ListMetadataField
  | LongMetadataField;
