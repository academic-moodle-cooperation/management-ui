import { fragmentRegistry } from "@oc-mui/plugin-system";
import { logger } from "@oc-mui/utils";

interface GraphQLErrorShape {
  message?: string;
  path?: ReadonlyArray<string | number>;
  extensions?: { classification?: string };
}

/**
 * graphql-java reports a `null` in a field the schema declares non-null as an
 * error and nulls the nearest nullable parent (for a list entry: that entry).
 * The rest of the response is intact. One broken record (an event that lost
 * its title in a failed workflow, for instance) must not take a whole table
 * down, so this error alone does not fail the request.
 */
const isNullBubbling = (error: GraphQLErrorShape): boolean =>
  error.extensions?.classification === "NullValueInNonNullableField" ||
  /declared as a non null type.*returned a null value/i.test(error.message ?? "");

/**
 * Matches stub fragments: "fragment PluginXxxFields on TypeName { __typename }".
 * Convention: core defines one such stub per extensible type (Event, Series, …);
 * at runtime each is replaced with merged plugin fragments for that type.
 */
const PLUGIN_FIELDS_STUB =
  /fragment\s+(Plugin\w+Fields)\s+on\s+(\w+)\s*\{\s*__typename\s*\}/g;

/**
 * Injects merged plugin fragments into the query string.
 * Replaces every stub fragment (PluginXxxFields on TypeName) with
 * fragmentRegistry.getMergedFragment(typeName, fragmentName).
 * Scales to any type: add a stub and spread in core queries, then plugins
 * register fragments for that targetType.
 */
function injectMergedFragments(query: string): string {
  if (typeof window === "undefined") return query;
  return query.replace(PLUGIN_FIELDS_STUB, (_, fragmentName: string, typeName: string) =>
    fragmentRegistry.getMergedFragment(typeName, fragmentName),
  );
}

export const fetchData = <TData, TVariables>(
  query: string,
  variables?: TVariables,
  options?: RequestInit["headers"],
): (() => Promise<TData>) => {
  return async () => {
    const finalQuery = injectMergedFragments(query);
    const response = await fetch("/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: finalQuery, variables, options }),
    });

    const json = await response.json();

    const errors: GraphQLErrorShape[] = Array.isArray(json.errors) ? json.errors : [];
    if (errors.length > 0 && json.data != null && errors.every(isNullBubbling)) {
      logger.warn("GraphQL response has null entries where the schema promises values; continuing with partial data", {
        paths: errors.map((e) => e.path?.join("/") ?? "?"),
      });
      return json.data;
    }

    // Check if there are GraphQL errors in the response
    if (json.errors && json.errors.length > 0) {
      // Create an error object with GraphQL error information
      const error = new Error(json.errors[0].message);
      // Add the errors array to the error object for more detailed information
      (error as Error & { graphQLErrors?: unknown[]; response?: unknown }).graphQLErrors =
        json.errors;
      // Add the response data as well (might be partially filled)
      (error as Error & { graphQLErrors?: unknown[]; response?: unknown }).response = json;
      throw error;
    }

    return json.data;
  };
};
