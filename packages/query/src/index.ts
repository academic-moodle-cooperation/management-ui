import type {
  StringMetadataField,
  IntMetadataField,
  DateTimeMetadataField,
  DurationMetadataField,
  JsonMetadataField,
  ListMetadataField,
  LongMetadataField,
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

export * from "./client";
export * from "./gql-generated";

// Explicitly re-export commonly used types for Vite/Rollup compatibility
// when using 'import type' syntax
export type {
  EventsDataFragment,
  GetEventByIdInputFieldsQuery,
  GetInputFieldsMetaDataFragment,
  CommonEventMetadataV2,
  GetSeriesByIdInputFieldsQuery,
  SeriesDataFragment,
  GetMySeriesNameAndIdQuery,
} from "./gql-generated";

export type MetadataFieldType =
  | StringMetadataField
  | IntMetadataField
  | DateTimeMetadataField
  | DurationMetadataField
  | JsonMetadataField
  | ListMetadataField
  | LongMetadataField;
