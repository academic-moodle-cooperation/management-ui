import { beforeEach, describe, expect, it } from "vitest";

import { useSidebarStore } from "./sidebarStore";

describe("series sidebar store", () => {
  beforeEach(() => {
    useSidebarStore.setState({
      isOpen: false,
      isEditing: false,
      selectedId: "",
      seriesUpdateData: undefined,
      updateField: "",
    });
  });

  it("clears draft metadata when resetUpdateFields is called", () => {
    useSidebarStore.setState({
      isEditing: true,
      seriesUpdateData: { title: "test" },
      updateField: "title",
    });

    useSidebarStore.getState().resetUpdateFields();

    expect(useSidebarStore.getState().seriesUpdateData).toBeUndefined();
    expect(useSidebarStore.getState().updateField).toBe("");
    expect(useSidebarStore.getState().isEditing).toBe(false);
  });

  it("allows setSeriesUpdateData to clear previously entered values", () => {
    useSidebarStore.getState().setSeriesUpdateData({ title: "test" });
    useSidebarStore.getState().setSeriesUpdateData(undefined);

    expect(useSidebarStore.getState().seriesUpdateData).toBeUndefined();
  });
});
