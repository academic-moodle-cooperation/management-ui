import { fireEvent, render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";

import { AclEditor } from "./index";

import type { ACLEntry } from "./types";

vi.mock("@oc-mui/i18n", () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));

vi.mock("@oc-mui/query", () => ({
  useMuiSearchUserQuery: () => ({ data: undefined, isLoading: false, isError: false }),
  useMuiGetAllManagedAclsQuery: () => ({ data: undefined, isLoading: false, isError: false }),
  useMuiGetManagedAclsWithEventIdQuery: () => ({ data: undefined, isLoading: false }),
  useMuiGetManagedAclsWithSeriesIdQuery: () => ({ data: undefined, isLoading: false }),
  useMuiUpdateEventAclMutation: () => ({ mutate: vi.fn() }),
  useMuiUpdateSeriesAclMutation: () => ({ mutate: vi.fn() }),
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}));

beforeAll(() => {
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  Element.prototype.hasPointerCapture ??= () => false;
  Element.prototype.scrollIntoView ??= () => {};
});

const entry = (action: string[]): ACLEntry => ({
  role: "ROLE_USER_ANNA",
  label: "Anna Beispiel",
  userId: "anna",
  action,
});

function renderEditor(entries: ACLEntry[]) {
  const onAclChange = vi.fn();
  render(
    <AclEditor
      selectedElement={{ __typename: "Event", id: "e1", title: "Vorlesung" }}
      aclEntries={entries}
      onAclChange={onAclChange}
      onManagedAclChange={vi.fn()}
    />,
  );
  const checkboxes = screen.getAllByRole("checkbox");
  return { onAclChange, read: checkboxes[0]!, write: checkboxes[1]! };
}

describe("AclEditor permissions", () => {
  it("shows read as granted and not togglable — presence in the list is read access", () => {
    const { read } = renderEditor([entry(["read"])]);

    expect(read.getAttribute("data-state")).toBe("checked");
    expect(read.hasAttribute("disabled")).toBe(true);
  });

  it("does not fire a change when the read checkbox is clicked", () => {
    const { onAclChange, read } = renderEditor([entry(["read"])]);

    fireEvent.click(read);

    expect(onAclChange).not.toHaveBeenCalled();
  });

  it("toggles write on and off while read holds the floor", () => {
    const { onAclChange, write } = renderEditor([entry(["read"])]);

    fireEvent.click(write);

    expect(onAclChange).toHaveBeenCalledTimes(1);
    expect(onAclChange.mock.calls[0]?.[0][0].action).toEqual(["read", "write"]);
  });

  it("refuses to leave an entry with no permission at all", () => {
    // A backend-supplied entry can carry write without read. Unchecking write
    // there would produce `action: []` — a row that looks like access in the
    // list but grants nothing. Revoking is the delete button's job.
    const { onAclChange, write } = renderEditor([entry(["write"])]);

    fireEvent.click(write);

    expect(onAclChange).not.toHaveBeenCalled();
  });

  it("renders a write-without-read entry as-is instead of silently adding read", () => {
    const { read, write } = renderEditor([entry(["write"])]);

    expect(read.getAttribute("data-state")).toBe("unchecked");
    expect(write.getAttribute("data-state")).toBe("checked");
  });
});

describe("AclEditor table layout", () => {
  it("declares column widths that total 100%", () => {
    renderEditor([entry(["read"])]);

    // `table-fixed` normalises anything else proportionally, so declared and
    // rendered proportions drift apart (they summed to 133% before).
    const widths = screen
      .getAllByRole("columnheader")
      .map((th) => /w-(\d+)\/(\d+)/.exec(th.className))
      .map((m) => (m ? Number(m[1]) / Number(m[2]) : 0));

    expect(widths).toHaveLength(4);
    expect(widths.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 5);
  });
});
