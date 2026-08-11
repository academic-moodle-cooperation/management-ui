
import { useQuery } from "@tanstack/react-query";
import { gql } from "graphql-request";
import { useMemo } from "react";

import { createGraphQLClient } from "../client";

import { useAppConfig } from "./useAppConfig";

/**
 * Which fields does this deployment's GraphQL input type actually accept?
 *
 * Opencast derives its metadata input types (`CommonEventMetadataInput`,
 * `CommonSeriesMetadataInput`) **per organization** from the catalog UI adapter
 * config: a property with `readOnly=true` is excluded from the input type
 * entirely. The committed codegen types are a snapshot of one server and can
 * only ever be a superset — submitting a field the org has made read-only is a
 * hard ValidationError, not an ignored extra (#278, #280).
 *
 * So the accepted field set is a runtime question, answered here by
 * introspecting the input type once per session and caching it for good.
 *
 * Fail-open by design: while loading, on error, or when the server has
 * introspection disabled (`__type` resolves to null), this returns `undefined`
 * and {@link pickAcceptedFields} passes payloads through unchanged — exactly
 * the pre-existing behaviour, so a server we cannot ask is no worse off.
 */
export function useAcceptedInputFields(typeName: string): ReadonlySet<string> | undefined {
  const { config, isError: isConfigError } = useAppConfig();
  const endpoint = config?.api.graphqlEndpoint;

  const { data } = useQuery<IntrospectInputFieldsResult, Error>({
    queryKey: ["acceptedInputFields", typeName, endpoint],
    enabled: Boolean(endpoint) && !isConfigError,
    staleTime: Infinity,
    gcTime: Infinity,
    queryFn: async () => {
      const client = createGraphQLClient(endpoint as string);
      return client.request<IntrospectInputFieldsResult>(MUI_INTROSPECT_INPUT_FIELDS, {
        typeName,
      });
    },
  });

  return useMemo(() => {
    const fields = data?.__type?.inputFields;
    if (!fields) return undefined;
    return new Set(fields.map((field) => field.name));
  }, [data]);
}

/**
 * Restricts a metadata payload to the fields an input type accepts.
 *
 * With an unknown accepted set (`undefined` — introspection still loading,
 * failed, or disabled) the payload is returned unchanged: fail open, never
 * block a save on our own bookkeeping.
 */
export function pickAcceptedFields<T extends Record<string, unknown>>(
  metadata: T,
  accepted: ReadonlySet<string> | undefined,
): T {
  if (!accepted) return metadata;
  return Object.fromEntries(Object.entries(metadata).filter(([key]) => accepted.has(key))) as T;
}

export interface IntrospectInputFieldsResult {
  __type?: {
    inputFields?: Array<{ name: string }> | null;
  } | null;
}

const MUI_INTROSPECT_INPUT_FIELDS = gql`
  query MuiIntrospectInputFields($typeName: String!) {
    __type(name: $typeName) {
      inputFields {
        name
      }
    }
  }
`;
