import {
  StringMetadataField,
  IntMetadataField,
  DateTimeMetadataField,
  DurationMetadataField,
  JsonMetadataField,
  ListMetadataField,
  LongMetadataField,
} from "./gql-generated";

export {
  useQuery,
  useQueries,
  useInfiniteQuery,
  useQueryClient,
  useMutation,
} from "@tanstack/react-query";
export type {
  QueryClient,
  InfiniteData,
  FetchNextPageOptions,
  InfiniteQueryObserverResult,
} from "@tanstack/react-query";
export { gql } from "graphql-request";

export * from "./QueryProvider";
export * from "./hooks";

export * from "./client";
export * from "./gql-generated";

export type MetadataFieldType =
  | StringMetadataField
  | IntMetadataField
  | DateTimeMetadataField
  | DurationMetadataField
  | JsonMetadataField
  | ListMetadataField
  | LongMetadataField;
