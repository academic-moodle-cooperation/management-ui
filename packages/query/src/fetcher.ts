export const fetchData = <TData, TVariables>(
  query: string,
  variables?: TVariables,
  options?: RequestInit["headers"]
): (() => Promise<TData>) => {
  return async () => {
    const response = await fetch("/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query, variables, options }),
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
