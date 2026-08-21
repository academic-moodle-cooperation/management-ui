import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DataTablePagination } from "./data-table-pagination";

vi.mock("@oc-mui/i18n", () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));

/**
 * The row-total counter was rendered under `!totalRows`, i.e. only when there
 * was nothing to count. Every populated table hid it — and since the row is
 * `justify-between`, its absence also pushed the page controls to the left.
 */
const tableStub = (rowCount: number) =>
  ({
    getState: () => ({ pagination: { pageSize: 10, pageIndex: 0 } }),
    getPageCount: () => Math.ceil(rowCount / 10),
    getCanPreviousPage: () => false,
    getCanNextPage: () => rowCount > 10,
    setPageIndex: vi.fn(),
    previousPage: vi.fn(),
    nextPage: vi.fn(),
    setPageSize: vi.fn(),
  }) as never;

describe("DataTablePagination row counter", () => {
  /** The counter is the only node holding all three fragments together. */
  const counter = () =>
    screen.queryByText((_, el) =>
      Boolean(
        el?.textContent?.match(/^\d+ pagination\.rows pagination\.total\.$/) &&
          el.children.length === 0,
      ),
    );

  it("shows the count for a populated table", () => {
    render(<DataTablePagination table={tableStub(42)} totalRows={42} />);

    expect(counter()?.textContent).toBe("42 pagination.rows pagination.total.");
  });

  it("still reports zero for an empty table", () => {
    render(<DataTablePagination table={tableStub(0)} totalRows={0} />);

    expect(counter()?.textContent).toBe("0 pagination.rows pagination.total.");
  });

  it("omits the counter when no total was supplied", () => {
    render(<DataTablePagination table={tableStub(0)} />);

    expect(counter()).toBeNull();
  });
});
