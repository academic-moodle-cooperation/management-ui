
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { useAcceptedInputFields, pickAcceptedFields } from "./useAcceptedInputFields";

// The org-trimmed shape from #278/#280: `creator` and `location` are readOnly
// in the org catalog config, so its CommonEventMetadataInput lacks them.
const ORG_TRIMMED_EVENT_INPUT_FIELDS = [
  "contributor",
  "description",
  "duration",
  "isPartOf",
  "language",
  "license",
  "rightsHolder",
  "source",
  "startDate",
  "subject",
  "title",
];

const mockRequest = vi.fn();

vi.mock("../client", () => ({
  createGraphQLClient: () => ({
    request: (...args: unknown[]) => mockRequest(...args),
  }),
}));

vi.mock("./useAppConfig", () => ({
  useAppConfig: () => ({
    config: { api: { graphqlEndpoint: "/graphql" } },
    isLoading: false,
    isError: false,
  }),
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider
    client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
  >
    {children}
  </QueryClientProvider>
);

describe("useAcceptedInputFields", () => {
  beforeEach(() => {
    mockRequest.mockReset();
  });

  it("resolves to the set of input field names the server declares", async () => {
    mockRequest.mockResolvedValue({
      __type: { inputFields: ORG_TRIMMED_EVENT_INPUT_FIELDS.map((name) => ({ name })) },
    });

    const { result } = renderHook(() => useAcceptedInputFields("CommonEventMetadataInput"), {
      wrapper,
    });

    await waitFor(() => expect(result.current).toBeDefined());
    expect(result.current?.has("title")).toBe(true);
    expect(result.current?.has("location")).toBe(false);
    expect(result.current?.has("creator")).toBe(false);
    expect(mockRequest).toHaveBeenCalledWith(expect.stringContaining("__type"), {
      typeName: "CommonEventMetadataInput",
    });
  });

  it("returns undefined when the server has introspection disabled", async () => {
    mockRequest.mockResolvedValue({ __type: null });

    const { result } = renderHook(() => useAcceptedInputFields("CommonEventMetadataInput"), {
      wrapper,
    });

    await waitFor(() => expect(mockRequest).toHaveBeenCalled());
    expect(result.current).toBeUndefined();
  });

  it("returns undefined while loading and on error (fail open)", async () => {
    mockRequest.mockRejectedValue(new Error("network down"));

    const { result } = renderHook(() => useAcceptedInputFields("CommonEventMetadataInput"), {
      wrapper,
    });

    expect(result.current).toBeUndefined();
    await waitFor(() => expect(mockRequest).toHaveBeenCalled());
    expect(result.current).toBeUndefined();
  });
});

describe("pickAcceptedFields", () => {
  const metadata = {
    title: "CAPTURE_SESSION_ID::x",
    contributor: ["Martin Schamberger"],
    location: "AV-Medien-Labor (2)",
    startDate: "2026-07-31T09:31:05.000Z",
  };

  it("drops fields the input type does not accept — the #280 payload", () => {
    const accepted = new Set(ORG_TRIMMED_EVENT_INPUT_FIELDS);
    expect(pickAcceptedFields(metadata, accepted)).toEqual({
      title: "CAPTURE_SESSION_ID::x",
      contributor: ["Martin Schamberger"],
      startDate: "2026-07-31T09:31:05.000Z",
    });
  });

  it("passes the payload through unchanged when the accepted set is unknown", () => {
    expect(pickAcceptedFields(metadata, undefined)).toEqual(metadata);
  });

  it("returns an empty object for an empty accepted set rather than failing", () => {
    expect(pickAcceptedFields(metadata, new Set())).toEqual({});
  });
});
