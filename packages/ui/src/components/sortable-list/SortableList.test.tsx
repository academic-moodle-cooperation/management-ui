import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SortableList, moveItem } from "./SortableList";

vi.mock("@oc-mui/i18n", () => ({
  useI18n: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options && "label" in options ? `${key}:${String(options["label"])}` : key,
  }),
}));

interface Track {
  id: string;
  name: string;
}

const tracks: Track[] = [
  { id: "a", name: "Alpha" },
  { id: "b", name: "Beta" },
  { id: "c", name: "Gamma" },
];

function renderList(overrides: Partial<Parameters<typeof SortableList<Track>>[0]> = {}) {
  const onReorder = vi.fn();
  const utils = render(
    <SortableList
      items={tracks}
      onReorder={onReorder}
      getItemLabel={(item) => item.name}
      renderItem={(item, { index, handle }) => (
        <div data-testid={`row-${item.id}`}>
          {handle}
          <span>
            {index + 1}. {item.name}
          </span>
        </div>
      )}
      {...overrides}
    />,
  );
  return { onReorder, ...utils };
}

// jsdom has no layout, so every rect is 0×0 at 0,0 and the keyboard
// coordinate getter would find no row "below" the picked-up one. Give each
// row a 40px-tall slot derived from its position instead.
const realGetBoundingClientRect = Element.prototype.getBoundingClientRect;

beforeEach(() => {
  Element.prototype.getBoundingClientRect = function (this: Element) {
    const row = this.closest("[data-slot='sortable-item']") as HTMLElement | null;
    const index = row ? Number(row.dataset["index"]) : 0;
    const top = index * 40;
    const rect = {
      x: 0,
      y: top,
      top,
      left: 0,
      width: 300,
      height: 40,
      right: 300,
      bottom: top + 40,
    };
    return { ...rect, toJSON: () => rect } as DOMRect;
  };
});

afterEach(() => {
  Element.prototype.getBoundingClientRect = realGetBoundingClientRect;
});

// dnd-kit measures the droppable rects asynchronously once a drag starts, so
// each key press gets a tick to settle before the next one arrives.
const press = async (element: HTMLElement, code: string, key: string) => {
  await act(async () => {
    fireEvent.keyDown(element, { code, key });
    await new Promise((resolve) => setTimeout(resolve, 50));
  });
};

describe("SortableList", () => {
  it("renders the items in the given order with a labelled handle each", () => {
    renderList();

    const rows = screen.getAllByText(/^\d\. /).map((node) => node.textContent);
    expect(rows).toEqual(["1. Alpha", "2. Beta", "3. Gamma"]);

    const handles = screen.getAllByRole("button", { name: /sortableList\.dragHandle:/ });
    expect(handles.map((handle) => handle.getAttribute("aria-label"))).toEqual([
      "sortableList.dragHandle:Alpha",
      "sortableList.dragHandle:Beta",
      "sortableList.dragHandle:Gamma",
    ]);
    // dnd-kit marks the activator as a sortable control for assistive tech.
    expect(handles[0]?.getAttribute("aria-roledescription")).toBe("sortable");
  });

  it("reorders with the keyboard: space picks up, arrow moves, space drops", async () => {
    const { onReorder } = renderList();
    const [alphaHandle] = screen.getAllByRole("button", { name: /dragHandle/ });

    await press(alphaHandle!, "Space", " ");
    await press(alphaHandle!, "ArrowDown", "ArrowDown");
    await press(alphaHandle!, "Space", " ");

    await waitFor(() => expect(onReorder).toHaveBeenCalledTimes(1));
    const [nextItems, move] = onReorder.mock.calls[0] as [Track[], unknown];
    expect(nextItems.map((item) => item.id)).toEqual(["b", "a", "c"]);
    expect(move).toEqual({ id: "a", from: 0, to: 1 });
  });

  it("does not report a move when the item is dropped where it was", async () => {
    const { onReorder } = renderList();
    const [alphaHandle] = screen.getAllByRole("button", { name: /dragHandle/ });

    await press(alphaHandle!, "Space", " ");
    await press(alphaHandle!, "Space", " ");

    expect(onReorder).not.toHaveBeenCalled();
  });

  it("disables every handle when the list is disabled", () => {
    renderList({ disabled: true });

    for (const handle of screen.getAllByRole("button", { name: /dragHandle/ })) {
      expect((handle as HTMLButtonElement).disabled).toBe(true);
    }
  });
});

describe("moveItem", () => {
  it("moves an element to a later position without mutating the input", () => {
    const input = ["a", "b", "c", "d"];
    expect(moveItem(input, 0, 2)).toEqual(["b", "c", "a", "d"]);
    expect(input).toEqual(["a", "b", "c", "d"]);
  });

  it("moves an element to an earlier position", () => {
    expect(moveItem(["a", "b", "c", "d"], 3, 1)).toEqual(["a", "d", "b", "c"]);
  });
});
