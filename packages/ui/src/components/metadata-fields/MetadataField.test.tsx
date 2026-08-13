import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { MetadataFieldType } from "@oc-mui/query";

import { MetadataField } from "./MetadataField";


vi.mock("@oc-mui/i18n", () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));

/**
 * `collection` is `Maybe<JSON>` in the schema, so a backend may send a
 * list-backed field without its option list. Observed on a real deployment:
 * `Object.keys(undefined)` threw and the error boundary replaced the whole
 * episodes info panel with "Module Error".
 */
const seriesField = (collection?: Record<string, string>) =>
  ({
    __typename: "ListMetadataField",
    id: "isPartOf",
    type: "TEXT",
    listProvider: "SERIES",
    value: "series-id-42",
    ...(collection ? { collection } : {}),
  }) as unknown as MetadataFieldType;

describe("MetadataField for a SERIES field", () => {
  it("renders the raw value when the collection is missing", () => {
    render(<MetadataField {...seriesField()} />);

    expect(screen.getByText("series-id-42")).toBeTruthy();
  });

  it("resolves the label when the collection is present", () => {
    render(<MetadataField {...seriesField({ "My Series": "series-id-42" })} />);

    expect(screen.getByText("My Series")).toBeTruthy();
  });
});
