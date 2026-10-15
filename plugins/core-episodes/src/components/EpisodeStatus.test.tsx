// @vitest-environment jsdom
// (this package's vitest config defaults to node; rendering needs a DOM)
import { render, renderHook } from "@testing-library/react";
import { CircleAlert } from "lucide-react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { EPISODE_STATUS_INDICATORS, type EpisodeStatusIndicator } from "@oc-mui/plugin-core";
import { createPlugin } from "@oc-mui/plugin-system";
import { HarnessPluginProvider, loadPluginInHarness, type TestHarness } from "@oc-mui/plugin-testing";
import type { MuiEventsDataFragment } from "@oc-mui/query";
import { logger } from "@oc-mui/utils";

// The real module boots i18next, which cannot run here. Keys pass through so
// the assertions can name them.
vi.mock("@oc-mui/i18n", () => ({
  i18next: { t: (key: string) => key },
  useExtensionLabels:
    () =>
    (entry: { key: string; label?: string }) =>
      entry.label ?? entry.key,
}));

import {
  EpisodeStatusCell,
  EpisodeThumbnailStatusOverlay,
  hasThumbnailStatusOverlay,
  useEpisodeStatusIndicator,
} from "./EpisodeStatus";

const event = (overrides: Partial<MuiEventsDataFragment> = {}): MuiEventsDataFragment =>
  ({
    __typename: "Event",
    id: "event-1",
    title: "Lecture 1",
    eventStatus: "EVENTS.EVENTS.STATUS.PROCESSED",
    hasPreview: true,
    publications: [],
    muiEventInfo: { isPublic: true, publishUrl: "https://example.invalid/play/1" },
    ...overrides,
  }) as MuiEventsDataFragment;

const pending: EpisodeStatusIndicator = {
  id: "publication-pending",
  matches: (e) => !e.muiEventInfo?.publishUrl,
  icon: CircleAlert,
  tone: "warning",
  label: "acme:status.pending",
};

/** Boot a manager with the given indicators registered by a throwaway plugin. */
const harnessWith = (...indicators: EpisodeStatusIndicator[]) =>
  loadPluginInHarness(
    createPlugin({
      namespace: "acme",
      type: "episodes-status",
      version: "1.0.0",
      initialize(manager) {
        for (const indicator of indicators) {
          manager.registerObject(EPISODE_STATUS_INDICATORS, indicator.id, indicator);
        }
      },
      activate() {},
      deactivate() {},
    }),
  );

describe("useEpisodeStatusIndicator", () => {
  let harness: TestHarness;
  afterEach(() => harness?.dispose());

  const resolve = (e: MuiEventsDataFragment) =>
    renderHook(() => useEpisodeStatusIndicator(e), {
      wrapper: ({ children }) => (
        <HarnessPluginProvider manager={harness.manager}>{children}</HarnessPluginProvider>
      ),
    }).result.current;

  it("is null when no plugin registered an indicator", async () => {
    harness = await harnessWith();
    expect(resolve(event({ muiEventInfo: { publishUrl: null } }))).toBeNull();
  });

  it("returns the indicator that claims the event, and nothing for the others", async () => {
    harness = await harnessWith(pending);
    expect(resolve(event({ muiEventInfo: { publishUrl: null } }))?.id).toBe("publication-pending");
    expect(resolve(event())).toBeNull();
  });

  it("prefers the lowest order when several indicators match", async () => {
    const always: EpisodeStatusIndicator = { ...pending, id: "always", matches: () => true };
    harness = await harnessWith({ ...always, id: "late", order: 200 }, { ...always, id: "early", order: 10 });
    expect(resolve(event())?.id).toBe("early");
  });

  it("skips an indicator whose matcher throws, and says so", async () => {
    const warn = vi.spyOn(logger, "warn").mockImplementation(() => {});
    const broken: EpisodeStatusIndicator = {
      ...pending,
      id: "broken",
      order: 1,
      matches: () => {
        throw new Error("boom");
      },
    };
    harness = await harnessWith(broken, pending);
    expect(resolve(event({ muiEventInfo: { publishUrl: null } }))?.id).toBe("publication-pending");
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('"broken"'),
      expect.objectContaining({ indicatorId: "broken", error: "boom" }),
    );
    warn.mockRestore();
  });
});

describe("EpisodeStatusCell", () => {
  let harness: TestHarness;
  afterEach(() => harness?.dispose());

  const renderCell = (e: MuiEventsDataFragment) =>
    render(
      <HarnessPluginProvider manager={harness.manager}>
        <EpisodeStatusCell event={e} />
      </HarnessPluginProvider>,
    );

  it("shows the default icon for the event status when nothing matches", async () => {
    harness = await harnessWith(pending);
    const { container } = renderCell(event());
    expect(container.querySelector("svg.lucide-circle-check")?.getAttribute("class")).toContain(
      "text-ok",
    );
    expect(container.querySelector("svg.lucide-circle-alert")).toBeNull();
  });

  it("shows the matching indicator's icon in its tone", async () => {
    harness = await harnessWith(pending);
    const { container } = renderCell(event({ muiEventInfo: { publishUrl: null } }));
    expect(container.querySelector("svg.lucide-circle-alert")?.getAttribute("class")).toContain(
      "text-warning",
    );
    expect(container.querySelector("svg.lucide-circle-check")).toBeNull();
  });
});

describe("EpisodeStatusCell with an indicator link", () => {
  let harness: TestHarness;
  afterEach(() => harness?.dispose());

  const linked: EpisodeStatusIndicator = {
    ...pending,
    id: "linked",
    href: (e) => `/editor-ui/index.html?mediaPackageId=${e.id}`,
  };

  const renderCell = (e: MuiEventsDataFragment) =>
    render(
      <HarnessPluginProvider manager={harness.manager}>
        <EpisodeStatusCell event={e} />
      </HarnessPluginProvider>,
    );

  it("turns the icon into a link to the indicator's target, opening in a new tab", async () => {
    harness = await harnessWith(linked);
    const { container } = renderCell(event({ id: "mp-7", muiEventInfo: { publishUrl: null } }));
    const a = container.querySelector("a");
    expect(a?.getAttribute("href")).toBe("/editor-ui/index.html?mediaPackageId=mp-7");
    expect(a?.getAttribute("target")).toBe("_blank");
    expect(a?.querySelector("svg.lucide-circle-alert")).not.toBeNull();
  });

  it("renders no link when href yields nothing", async () => {
    harness = await harnessWith({ ...linked, href: () => null });
    const { container } = renderCell(event({ muiEventInfo: { publishUrl: null } }));
    expect(container.querySelector("a")).toBeNull();
  });

  it("ignores a throwing href and says so", async () => {
    const warn = vi.spyOn(logger, "warn").mockImplementation(() => {});
    harness = await harnessWith({
      ...linked,
      href: () => {
        throw new Error("nope");
      },
    });
    const { container } = renderCell(event({ muiEventInfo: { publishUrl: null } }));
    expect(container.querySelector("a")).toBeNull();
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("href()"),
      expect.objectContaining({ indicatorId: "linked", error: "nope" }),
    );
    warn.mockRestore();
  });
});

describe("gallery thumbnail overlay", () => {
  it("covers every event that is not plainly processed", () => {
    expect(hasThumbnailStatusOverlay(event(), null)).toBe(false);
    expect(hasThumbnailStatusOverlay(event({ eventStatus: "PROCESSING" }), null)).toBe(true);
    expect(hasThumbnailStatusOverlay(event(), pending)).toBe(true);
  });

  it("renders the indicator's icon over the thumbnail", () => {
    const { container } = render(<EpisodeThumbnailStatusOverlay event={event()} indicator={pending} />);
    expect(container.querySelector("svg.lucide-circle-alert")).not.toBeNull();
  });

  it("renders nothing for a processed event without an indicator", () => {
    const { container } = render(<EpisodeThumbnailStatusOverlay event={event()} indicator={null} />);
    expect(container.innerHTML).toBe("");
  });
});
