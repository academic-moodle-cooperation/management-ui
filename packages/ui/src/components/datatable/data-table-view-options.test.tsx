import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";

import { DataTableViewOptions } from "./data-table-view-options";

import type { ColumnDef } from "@tanstack/react-table";

vi.mock("@oc-mui/i18n", () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));

// Radix's popper positioning needs browser APIs jsdom does not implement.
beforeAll(() => {
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  Element.prototype.hasPointerCapture ??= () => false;
  Element.prototype.releasePointerCapture ??= () => {};
  Element.prototype.scrollIntoView ??= () => {};
});

interface Row {
  title: string;
  series: string;
}

const columns: ColumnDef<Row>[] = [
  { id: "title", accessorKey: "title" },
  { id: "series", accessorKey: "series" },
];

function Harness() {
  const table = useReactTable<Row>({
    data: [{ title: "Vorlesung", series: "Informatik" }],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return <DataTableViewOptions table={table} />;
}

const openMenu = async () => {
  fireEvent.pointerDown(
    screen.getByRole("button", { name: /viewOptions/i }),
    { button: 0, ctrlKey: false, pointerType: "mouse" },
  );
  return waitFor(() => screen.getByRole("menu"));
};

describe("DataTableViewOptions", () => {
  it("closes on Escape while the pointer rests inside the menu", async () => {
    render(<Harness />);
    const menu = await openMenu();

    // The regression (#252): the menu tracked pointer enter/leave on its
    // content and suppressed every close signal while the pointer was inside,
    // so Escape did nothing and the Radix overlay kept swallowing page clicks.
    // (mouseover, not pointerenter — that is the event React synthesizes
    // onMouseEnter from, and the one the old workaround reacted to.)
    fireEvent.mouseOver(menu);
    fireEvent.keyDown(menu, { key: "Escape" });

    await waitFor(() => expect(screen.queryByRole("menu")).toBeNull());
  });

  it("closes on Escape after a column was toggled with the pointer inside", async () => {
    render(<Harness />);
    const menu = await openMenu();

    // React synthesizes onMouseEnter from mouseover — the event the old
    // workaround listened to in order to set its "never close" flag.
    fireEvent.mouseOver(menu);
    fireEvent.click(screen.getByRole("menuitemcheckbox", { name: /title/i }));

    expect(screen.queryByRole("menu")).not.toBeNull();

    fireEvent.keyDown(screen.getByRole("menu"), { key: "Escape" });

    await waitFor(() => expect(screen.queryByRole("menu")).toBeNull());
  });

  it("stays open while columns are toggled", async () => {
    render(<Harness />);
    await openMenu();

    const title = screen.getByRole("menuitemcheckbox", { name: /title/i });
    expect(title.getAttribute("aria-checked")).toBe("true");

    fireEvent.click(title);

    await waitFor(() =>
      expect(
        screen.getByRole("menuitemcheckbox", { name: /title/i }).getAttribute("aria-checked"),
      ).toBe("false"),
    );
    expect(screen.queryByRole("menu")).not.toBeNull();
  });

  it("marks the portalled content as sidebar-inside so the table sidebar stays open", async () => {
    render(<Harness />);
    const menu = await openMenu();

    // `useClickOutside` bails on this class; without it, opening this menu
    // would read as a click outside the sidebar and close it.
    expect(menu.closest(".sidebar-portal-inside")).not.toBeNull();
  });
});
