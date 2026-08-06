import { useMutation, type UseMutationResult } from "@tanstack/react-query";
import { gql } from "graphql-request";

import { createGraphQLClient } from "../client";

import { useAppConfig } from "./useAppConfig";

/**
 * Permanent, index-level deletion of an event — the stock top-level
 * `deleteEvent` mutation (`IndexService.removeEvent`), as opposed to the custom
 * `mui.deleteEvent` soft delete that moves the event into the trash series.
 *
 * Hand-written rather than generated, on purpose. `packages/query`'s codegen
 * introspects a **live** endpoint, so regenerating for one mutation also pulls in
 * whatever else that backend happens to expose — on the dev backend that is
 * playlist support, which is not part of this project yet and would land in the
 * published type surface as a side effect. Until the canonical backend matches
 * the committed snapshot, an operation is cheaper to write out than to generate.
 *
 * `useGetCurrentUser` in this directory follows the same pattern for the same
 * reason, so this is the established escape hatch rather than a new one.
 */
export interface DeleteEventPermanentlyResult {
  deleteEvent?: {
    id?: string | null;
    status?: string | null;
  } | null;
}

const MUI_DELETE_EVENT_PERMANENTLY = gql`
  mutation MuiDeleteEventPermanently($eventId: String!) {
    deleteEvent(id: $eventId) {
      id
      status
    }
  }
`;

export function useDeleteEventPermanentlyMutation(): UseMutationResult<
  DeleteEventPermanentlyResult,
  Error,
  { eventId: string }
> {
  const { config, isError: isConfigError } = useAppConfig();

  return useMutation<DeleteEventPermanentlyResult, Error, { eventId: string }>({
    mutationKey: ["deleteEventPermanently", config?.api.graphqlEndpoint],
    mutationFn: async ({ eventId }) => {
      if (isConfigError) {
        throw new Error("GraphQL endpoint configuration error.");
      }
      if (!config?.api.graphqlEndpoint) {
        throw new Error("GraphQL endpoint is not configured.");
      }

      const client = createGraphQLClient(config.api.graphqlEndpoint);
      return client.request<DeleteEventPermanentlyResult>(MUI_DELETE_EVENT_PERMANENTLY, {
        eventId,
      });
    },
  });
}
