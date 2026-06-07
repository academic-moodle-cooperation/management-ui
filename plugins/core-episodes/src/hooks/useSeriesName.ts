import { useMuiGetSeriesNameByIdQuery } from "@oc-mui/query";

/**
 * Whether the series-name lookup should run for the given identifier.
 *
 * The `seriesById` resolver rejects a null/empty identifier with
 * "Identifier cannot be null". The episodes route renders both the
 * "all episodes" view (no series) and a series-scoped view, so `seriesId`
 * is frequently undefined or an empty string — in that case the request
 * must be skipped entirely rather than issued with a null identifier.
 */
export const isSeriesNameQueryEnabled = (seriesId?: string): boolean => Boolean(seriesId);

/**
 * Resolve a series title by id for the episodes heading.
 *
 * Returns `undefined` (without hitting the backend) until a non-empty
 * `seriesId` is available, guarding against the "Identifier cannot be null"
 * GraphQL error raised by an unconditional `seriesById` lookup.
 */
export function useSeriesName(seriesId?: string): string | undefined {
  const { data } = useMuiGetSeriesNameByIdQuery(
    { seriesId: seriesId ?? "" },
    { enabled: isSeriesNameQueryEnabled(seriesId) },
  );

  return data?.seriesById?.title;
}
