import { describe, expect, it } from "vitest";

import { restrictSortingToFields } from "./restrict-sorting";

import type { ColumnDef } from "@tanstack/react-table";

type Row = { title: string; description: string; isPublic: boolean };

const SORTABLE = ["title", "startDate"] as const;

describe("restrictSortingToFields", () => {
  it("disables sorting on a string-accessor column whose field isn't sortable", () => {
    const columns: ColumnDef<Row, unknown>[] = [{ accessorKey: "description" }];
    const [out] = restrictSortingToFields(columns, SORTABLE);
    expect(out?.enableSorting).toBe(false);
  });

  it("leaves a sortable string-accessor column untouched (default-sortable)", () => {
    const columns: ColumnDef<Row, unknown>[] = [{ accessorKey: "title" }];
    const [out] = restrictSortingToFields(columns, SORTABLE);
    expect(out?.enableSorting).toBeUndefined();
  });

  it("disables sorting on a function-accessor column by its explicit id", () => {
    const columns: ColumnDef<Row, unknown>[] = [
      { id: "isPublic", accessorFn: (row) => row.isPublic },
    ];
    const [out] = restrictSortingToFields(columns, SORTABLE);
    expect(out?.enableSorting).toBe(false);
  });

  it("does not override an explicit enableSorting: false", () => {
    const columns: ColumnDef<Row, unknown>[] = [
      { accessorKey: "title", enableSorting: false },
    ];
    const [out] = restrictSortingToFields(columns, SORTABLE);
    // Even though "title" is sortable, the explicit author decision wins.
    expect(out?.enableSorting).toBe(false);
  });

  it("does not override an explicit enableSorting: true", () => {
    const columns: ColumnDef<Row, unknown>[] = [
      { accessorKey: "description", enableSorting: true },
    ];
    const [out] = restrictSortingToFields(columns, SORTABLE);
    // Author explicitly opted in; the helper respects it even though
    // "description" isn't in the list.
    expect(out?.enableSorting).toBe(true);
  });

  it("leaves a display column (no accessor, non-field id) disabled-by-default alone", () => {
    // "actions" has no accessorKey and isn't a sortable field, so it gets
    // enableSorting: false — harmless, since display columns can't sort anyway.
    const columns: ColumnDef<Row, unknown>[] = [{ id: "actions" }];
    const [out] = restrictSortingToFields(columns, SORTABLE);
    expect(out?.enableSorting).toBe(false);
  });

  it("does not mutate the input array or its columns", () => {
    const original: ColumnDef<Row, unknown>[] = [{ accessorKey: "description" }];
    const snapshot = JSON.stringify(original);
    restrictSortingToFields(original, SORTABLE);
    expect(JSON.stringify(original)).toBe(snapshot);
  });

  it("accepts a readonly field list", () => {
    const columns: ColumnDef<Row, unknown>[] = [{ accessorKey: "title" }];
    // SORTABLE is `as const` (readonly) — must compile and work.
    expect(() => restrictSortingToFields(columns, SORTABLE)).not.toThrow();
  });
});
