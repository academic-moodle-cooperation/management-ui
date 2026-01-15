import {
  useQuery,
  type UseQueryResult,
  type UseQueryOptions,
  type QueryKey,
} from "@tanstack/react-query";

// Define a generic function signature for useGenericQuery
// It should accept a QueryKey, a queryFn, and optional options, similar to useQuery
export function useGenericQuery<
  TQueryFnData = unknown,
  TError = Error,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(options: UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>): UseQueryResult<TData, TError> {
  return useQuery(options);
}

// Re-export relevant types from @tanstack/react-query
export type { UseQueryResult, UseQueryOptions, QueryKey };

// If you want a version that accepts queryKey and queryFn separately (more like older useQuery versions):
/*
export function useGenericQuery<TQueryFnData = unknown, TError = Error, TData = TQueryFnData, TQueryKey extends QueryKey = QueryKey>(
  queryKey: TQueryKey,
  queryFn: () => Promise<TQueryFnData>,
  options?: Omit<UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>, 'queryKey' | 'queryFn'>
): UseQueryResult<TData, TError> {
  return useQuery(queryKey, queryFn, options);
}
*/
