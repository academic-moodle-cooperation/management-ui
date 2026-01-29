import { fragmentRegistry } from "@workspace/plugin-system";

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
