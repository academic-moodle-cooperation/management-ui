import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PageShell } from "./page-shell";

describe("PageShell", () => {
  it("renders title, description, actions and content in the standard frame", () => {
    render(
      <PageShell title="Videos" description="All recordings" actions={<button>New</button>}>
        <p>content</p>
      </PageShell>,
    );

    expect(screen.getByRole("heading", { name: "Videos" })).toBeDefined();
    expect(screen.getByText("All recordings")).toBeDefined();
    expect(screen.getByRole("button", { name: "New" })).toBeDefined();
    expect(screen.getByText("content")).toBeDefined();
  });

  it("omits description and actions when not provided", () => {
    render(<PageShell title="Series">x</PageShell>);

    expect(screen.getByRole("heading", { name: "Series" })).toBeDefined();
    expect(screen.queryByRole("button")).toBeNull();
  });
});
