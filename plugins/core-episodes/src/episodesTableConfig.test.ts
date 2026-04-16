import { describe, expect, it } from "vitest";

import type { EpisodesTable as EpisodesTableConfig } from "@workspace/ui-config";

import {
  getEpisodesColumnLabelOverrides,
  resolveColumnLabel,
  resolveColumnMeta,
  resolveEpisodesViewConfig,
} from "./episodesTableConfig";

describe("episodesTableConfig", () => {
  it("reuses legacy columns config for both list and gallery views", () => {
    const tableConfig: EpisodesTableConfig = {
      columns: [
        { title: { show: true, labelKey: "episodes:episodesTable.heading.title" } },
        { seriesName: { show: false } },
      ],
    };

    expect(resolveEpisodesViewConfig(tableConfig, "list")).toEqual({
      enabled: true,
      columns: [
        { key: "title", show: true, labelKey: "episodes:episodesTable.heading.title" },
        { key: "seriesName", show: false },
      ],
    });

    expect(resolveEpisodesViewConfig(tableConfig, "gallery")).toEqual({
      enabled: true,
      columns: [
        { key: "title", show: true, labelKey: "episodes:episodesTable.heading.title" },
        { key: "seriesName", show: false },
      ],
    });
  });

  it("prefers view-specific gallery config and supports disabling the gallery view", () => {
    const tableConfig: EpisodesTableConfig = {
      columns: [{ title: { show: true } }],
      views: {
        gallery: {
          enabled: false,
          columns: [
            { title: { show: true, labelKey: "episodes:episodesTable.heading.video" } },
            { startDate: { show: true, label: "Termin" } },
          ],
        },
      },
    };

    expect(resolveEpisodesViewConfig(tableConfig, "gallery")).toEqual({
      enabled: false,
      columns: [
        { key: "title", show: true, labelKey: "episodes:episodesTable.heading.video" },
        { key: "startDate", show: true, label: "Termin" },
      ],
    });

    expect(resolveEpisodesViewConfig(tableConfig, "list")).toEqual({
      enabled: true,
      columns: [{ key: "title", show: true }],
    });
  });

  it("builds and resolves label overrides from configured columns", () => {
    const overrides = getEpisodesColumnLabelOverrides([
      { key: "title", show: true, labelKey: "episodes:episodesTable.heading.video" },
      { key: "startDate", show: true, label: "Termin" },
      { key: "seriesName", show: true },
    ]);

    expect(overrides).toEqual({
      title: { labelKey: "episodes:episodesTable.heading.video" },
      startDate: { label: "Termin" },
    });

    expect(
      resolveColumnLabel(overrides, "title", "episodes:episodesTable.heading.title", (key) => key),
    ).toBe("episodes:episodesTable.heading.video");
    expect(
      resolveColumnLabel(
        overrides,
        "startDate",
        "episodes:episodesTable.heading.startDate",
        (key) => key,
      ),
    ).toBe("Termin");

    expect(resolveColumnMeta(overrides, "title", "episodes:episodesTable.heading.title")).toEqual({
      translatedTitle: "episodes:episodesTable.heading.video",
    });
    expect(
      resolveColumnMeta(overrides, "startDate", "episodes:episodesTable.heading.startDate"),
    ).toEqual({
      resolvedTitle: "Termin",
    });
  });
});
