import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SidebarProvider } from "../../ui";

import { NavMain } from "./nav-main";

// What the label resolver returns per registered title. Stands in for
// `useExtensionLabels`, whose fallback for a key whose namespace has not
// loaded yet is derived from the part after the colon.
let labels: Record<string, string> = {};

vi.mock("@oc-mui/i18n", () => ({
  useExtensionLabels: () => (entry: { key: string }) => labels[entry.key] ?? entry.key,
}));

const items = [
  { title: "org-support:nav.title", url: "/support" },
  { title: "org-report:nav.title", url: "/report" },
];

const renderNav = () => (
  <SidebarProvider>
    <NavMain items={items} />
  </SidebarProvider>
);

describe("NavMain", () => {
  beforeEach(() => {
    labels = {};
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: (query: string) => ({
        matches: false,
        media: query,
        addEventListener: () => {},
        removeEventListener: () => {},
      }),
    });
  });

  // Two plugins that both name their key `nav.title` share one fallback label
  // until their namespaces arrive. With the label as the React key, a row was
  // left behind after the labels resolved: one entry showed up twice.
  it("renders each item once when items share a label while namespaces load", () => {
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});

    labels = { "org-support:nav.title": "Nav.Title", "org-report:nav.title": "Nav.Title" };
    const { rerender } = render(renderNav());
    expect(screen.getAllByRole("link")).toHaveLength(2);

    labels = { "org-support:nav.title": "Support", "org-report:nav.title": "Report" };
    rerender(renderNav());

    expect(screen.getAllByRole("link").map((link) => link.textContent)).toEqual([
      "Support",
      "Report",
    ]);
    expect(errors.mock.calls.flat().join(" ")).not.toContain("same key");

    errors.mockRestore();
  });
});
