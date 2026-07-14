import { describe, expect, it } from "vitest";

import { isAuthenticationError } from "./isAuthenticationError";

/**
 * `isAuthenticationError` decides whether a failed `currentUser` fetch means the
 * session is invalid (→ send to login) or the backend is merely unreachable
 * (→ keep the session, show an error screen). Only 401/403 (or the equivalent
 * GraphQL codes/messages) count as authentication errors; everything else is a
 * transient server/network error.
 */
describe("isAuthenticationError", () => {
  it.each([
    ["HTTP 401 in the message", "Request failed with status code 401"],
    ["HTTP 403 in the message", "Forbidden: 403"],
    ["the word unauthorized", "Unauthorized"],
    ["the word forbidden", "You are forbidden"],
  ])("treats %s as an auth error", (_label, message) => {
    expect(isAuthenticationError(new Error(message))).toBe(true);
  });

  it("detects a GraphQL UNAUTHENTICATED extension code", () => {
    const err = Object.assign(new Error("bad"), {
      graphQLErrors: [{ extensions: { code: "UNAUTHENTICATED" } }],
    });
    expect(isAuthenticationError(err)).toBe(true);
  });

  it("detects a GraphQL FORBIDDEN extension code", () => {
    const err = Object.assign(new Error("bad"), {
      graphQLErrors: [{ extensions: { code: "FORBIDDEN" } }],
    });
    expect(isAuthenticationError(err)).toBe(true);
  });

  it("detects a GraphQL error whose message mentions unauthorized/forbidden", () => {
    const err = Object.assign(new Error("bad"), {
      graphQLErrors: [{ message: "Access forbidden for this resource" }],
    });
    expect(isAuthenticationError(err)).toBe(true);
  });

  it("detects a 401/403 on the error's HTTP response", () => {
    expect(isAuthenticationError(Object.assign(new Error("x"), { response: { status: 401 } }))).toBe(
      true,
    );
    expect(isAuthenticationError(Object.assign(new Error("x"), { response: { status: 403 } }))).toBe(
      true,
    );
  });

  it.each([
    ["a 500 server error", new Error("Request failed with status code 500")],
    ["a network error", new Error("ECONNREFUSED")],
    ["an error with no message", new Error()],
    ["an empty graphQLErrors array", Object.assign(new Error("x"), { graphQLErrors: [] })],
    [
      "a non-auth HTTP response status",
      Object.assign(new Error("x"), { response: { status: 503 } }),
    ],
  ])("treats %s as NOT an auth error", (_label, err) => {
    expect(isAuthenticationError(err as Error)).toBe(false);
  });
});
