import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { MetadataField } from "./MetadataField";

vi.mock("@oc-mui/i18n", () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));

/**
 * `collection` is `Maybe<JSON>` in the GraphQL schema, so a backend may send a
 * list-backed field without its option list. Observed on a real deployment: it
 * threw `Object.keys(undefined)` and the error boundary replaced the whole
 * episodes module with "Module Error".
 */
describe("MetadataField with a missing collection", () => {
  it("renders the raw value for a SERIES field instead of throwing", () => {
    render(
      <MetadataField
        type={"TEXT" as never}
        listProvider="SERIES"
        value="series-id-42"
        {...({} as never)}
      />,
    );
    expect(screen.getByText("series-id-42")).toBeInTheDocument();
  });

  it("resolves the label when the collection is present", () => {
    render(
      <MetadataField
        type={"TEXT" as never}
        listProvider="SERIES"
        collection={{ "My Series": "series-id-42" } as never}
        value="series-id-42"
        {...({} as never)}
      />,
    );
    expect(screen.getByText("My Series")).toBeInTheDocument();
  });
});
