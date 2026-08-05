import { defaultConfig } from "../../../packages/ui-config/src";

import type { Page, Route } from "@playwright/test";

/**
 * A mocked Opencast for the protocol-driven E2E specs.
 *
 * Unlike the one-liner stubs in `_mock-backend.ts` (which answer every GraphQL
 * call with `{ data: null }`), this one holds a small mutable store and answers
 * per operation: it honours `query`, `orderBy`, `limit` and `offset`, and its
 * mutations actually change the store. That matters — a table test against a
 * frozen response proves nothing about pagination or persistence, and a "save"
 * test against a stub can't tell a successful write from a silently dropped one.
 *
 * It also records every operation it served. Tests assert on `calls` when the
 * behaviour under test is *what the frontend asked the backend for* — which is
 * the only honest thing to assert when the real logic lives server-side (see the
 * search steps in protocol-series.spec.ts).
 */

export interface MockSeries {
  id: string;
  title: string;
  description: string;
  creator: string;
  created: string;
  contributors: string[];
  eventCount: number;
}

export interface MockEvent {
  id: string;
  title: string;
  seriesId: string | null;
  seriesName: string | null;
  creator: string;
  created: string;
  startDate: string;
  location: string;
  presenters: string[];
  contributors: string[];
  description: string;
  displayableStatus: string;
  eventStatus: string;
  hasPreview: boolean;
  /** ISO 8601 duration — the UI parses this with tinyduration, not a ms number. */
  duration: string;
}

export interface RecordedCall {
  operationName: string;
  variables: Record<string, unknown>;
}

export interface IngestCall {
  /** Last path segment, e.g. "createMediaPackage", "addTrack", "ingest". */
  endpoint: string;
  body: string;
}

export interface MockBackend {
  series: MockSeries[];
  events: MockEvent[];
  /** Every GraphQL operation served, in order. */
  calls: RecordedCall[];
  /** Every /ingest/* request served, in order. */
  ingestCalls: IngestCall[];
  /** Delay applied to /ingest/addTrack, to keep an upload observably in flight. */
  trackUploadDelayMs: number;
  /** Calls for one operation, most recent last. */
  callsTo(operationName: string): RecordedCall[];
  lastCallTo(operationName: string): RecordedCall | undefined;
}

let seriesSeq = 0;
let eventSeq = 0;

export function makeSeries(overrides: Partial<MockSeries> = {}): MockSeries {
  seriesSeq += 1;
  return {
    id: `series-${seriesSeq}`,
    title: `Serie ${seriesSeq}`,
    description: `Beschreibung ${seriesSeq}`,
    creator: "Test Creator",
    // Descending creation dates so the default sort (`created` desc) is stable
    // and predictable across a seeded list.
    created: `2026-01-${String(28 - (seriesSeq % 28)).padStart(2, "0")}T10:00:00Z`,
    contributors: ["Contributor A"],
    eventCount: 2,
    ...overrides,
  };
}

export function makeEvent(overrides: Partial<MockEvent> = {}): MockEvent {
  eventSeq += 1;
  return {
    id: `event-${eventSeq}`,
    title: `Video ${eventSeq}`,
    seriesId: "series-1",
    seriesName: "Serie 1",
    creator: "Test Creator",
    created: `2026-02-${String(28 - (eventSeq % 28)).padStart(2, "0")}T10:00:00Z`,
    startDate: `2026-02-${String(28 - (eventSeq % 28)).padStart(2, "0")}T10:00:00Z`,
    location: "Hörsaal 1",
    presenters: ["Presenter A"],
    contributors: [],
    description: "",
    displayableStatus: "SUCCEEDED",
    eventStatus: "SUCCEEDED",
    hasPreview: true,
    duration: "PT10M",
    ...overrides,
  };
}

/** Reset the id counters so a spec file's seeds are reproducible. */
export function resetSeeds(): void {
  seriesSeq = 0;
  eventSeq = 0;
}

const seriesNode = (s: MockSeries) => ({
  __typename: "Series",
  id: s.id,
  contributors: s.contributors,
  created: s.created,
  creator: s.creator,
  description: s.description,
  title: s.title,
  events: {
    nodes: Array.from({ length: s.eventCount }, (_, i) => ({
      id: `${s.id}-e${i}`,
      title: `${s.title} — Episode ${i + 1}`,
      eventStatus: "SUCCEEDED",
    })),
    totalCount: s.eventCount,
  },
  muiSeriesInfo: { isPublic: true, managedAclId: null },
});

const eventNode = (e: MockEvent) => ({
  __typename: "Event",
  contributors: e.contributors,
  seriesName: e.seriesName,
  seriesId: e.seriesId,
  title: e.title,
  creator: e.creator,
  created: e.created,
  description: e.description,
  displayableStatus: e.displayableStatus,
  eventStatus: e.eventStatus,
  duration: e.duration,
  hasPreview: e.hasPreview,
  id: e.id,
  location: e.location,
  presenters: e.presenters,
  startDate: e.startDate,
  publications: [],
  muiEventInfo: {
    isPublic: true,
    managedAclId: null,
    publishUrl: `https://example.invalid/play/${e.id}`,
    thumbnailUrl: e.hasPreview ? `https://example.invalid/thumb/${e.id}.jpg` : null,
  },
});

/**
 * The edit mask is driven by `commonMetadataV2`, not by the list row: the
 * sidebar opens read-only from the list data, and the *editable* fields come
 * from a separate `…InputFields` query describing each field (label, type,
 * required, readOnly, value). Without this the mask renders empty — which is
 * how the first draft of these specs failed.
 */
const metaField = (id: string, label: string, value: unknown, order: number, type = "text") => ({
  collectionId: null,
  collection: null,
  id,
  label,
  listProvider: null,
  order,
  readOnly: false,
  required: id === "title",
  type,
  value,
});

const seriesMetadata = (s: MockSeries) => ({
  contributor: metaField("contributor", "Contributors", s.contributors, 4, "text"),
  title: metaField("title", "Title", s.title, 0),
  subject: metaField("subject", "Subject", "", 5),
  rightsHolder: metaField("rightsHolder", "Rights holder", "", 6),
  publisher: metaField("publisher", "Publisher", [], 7, "text"),
  license: metaField("license", "License", "", 8),
  language: metaField("language", "Language", "", 9),
  identifier: metaField("identifier", "Identifier", s.id, 10),
  description: metaField("description", "Description", s.description, 1),
  creator: metaField("creator", "Creator", [s.creator], 2, "text"),
});

const eventMetadata = (e: MockEvent) => ({
  contributor: metaField("contributor", "Contributors", e.contributors, 6, "text"),
  created: metaField("created", "Created", e.created, 10, "date"),
  creator: metaField("creator", "Creator", [e.creator], 3, "text"),
  description: metaField("description", "Description", e.description, 1),
  duration: metaField("duration", "Duration", e.duration, 11, "duration"),
  identifier: metaField("identifier", "Identifier", e.id, 12),
  isPartOf: metaField("isPartOf", "Series", e.seriesId, 2),
  language: metaField("language", "Language", "", 7),
  license: metaField("license", "License", "", 8),
  location: metaField("location", "Location", e.location, 4),
  publisher: metaField("publisher", "Publisher", "", 9),
  rightsHolder: metaField("rightsHolder", "Rights holder", "", 13),
  source: metaField("source", "Source", "", 14),
  startDate: metaField("startDate", "Start date", e.startDate, 5, "date"),
  subject: metaField("subject", "Subject", "", 15),
  title: metaField("title", "Title", e.title, 0),
});

/** Server-side search, modelled as a plain substring match over the text fields. */
function matchesQuery(haystack: string[], query: unknown): boolean {
  if (typeof query !== "string" || query.trim() === "") return true;
  const needle = query.toLowerCase();
  return haystack.some((field) => (field ?? "").toLowerCase().includes(needle));
}

function applyOrderBy<T extends Record<string, unknown>>(rows: T[], orderBy: unknown): T[] {
  if (!orderBy || typeof orderBy !== "object") return rows;
  const [field, direction] = Object.entries(orderBy as Record<string, string>)[0] ?? [];
  if (!field) return rows;
  const sorted = [...rows].sort((a, b) =>
    String(a[field] ?? "").localeCompare(String(b[field] ?? "")),
  );
  return String(direction).toUpperCase() === "DESC" ? sorted.reverse() : sorted;
}

function paginate<T>(rows: T[], variables: Record<string, unknown>) {
  const offset = Number(variables["offset"] ?? 0);
  const limit = Number(variables["limit"] ?? rows.length);
  return { totalCount: rows.length, nodes: rows.slice(offset, offset + limit) };
}

type AppConfig = typeof defaultConfig;

export interface MockBackendOptions {
  series?: MockSeries[];
  events?: MockEvent[];
  config?: AppConfig;
  user?: { username: string; name: string; email: string; roles: string[] } | null;
  /** Hold /ingest/addTrack open this long, so the progress UI stays observable. */
  trackUploadDelayMs?: number;
}

/**
 * Route the shell's boot endpoints and `/graphql` to an in-memory backend.
 * Call before `page.goto()`.
 */
export async function installMockBackend(
  page: Page,
  options: MockBackendOptions = {},
): Promise<MockBackend> {
  const backend: MockBackend = {
    series: options.series ?? [],
    events: options.events ?? [],
    calls: [],
    ingestCalls: [],
    trackUploadDelayMs: options.trackUploadDelayMs ?? 0,
    callsTo(operationName) {
      return backend.calls.filter((c) => c.operationName === operationName);
    },
    lastCallTo(operationName) {
      return backend.callsTo(operationName).at(-1);
    },
  };

  const user =
    options.user === undefined
      ? {
          username: "tester",
          name: "Test User",
          email: "tester@example.invalid",
          roles: ["ROLE_ADMIN"],
        }
      : options.user;

  const json = (body: unknown) => ({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify(body),
  });

  // The dev-only TanStack devtools render a floating badge in the bottom-right
  // corner whose SVG intercepts pointer events — it sits on top of the edit
  // sidebar's buttons and makes them unclickable. These specs must run against
  // `vite dev`, so hide the badges rather than fight them.
  await page.addInitScript(() => {
    const hide = () => {
      const style = document.createElement("style");
      style.textContent =
        ".TanStackRouterDevtoolsPanel," +
        'button[aria-label="Open TanStack Router Devtools"],' +
        'button[aria-label="Open Tanstack query devtools"],' +
        ".tsqd-open-btn-container,.tsqd-parent-container{display:none !important;}";
      document.head.appendChild(style);
    };
    if (document.head) hide();
    else document.addEventListener("DOMContentLoaded", hide);
  });

  await page.route("**/ui/config/management-ui/config.json", (route) =>
    route.fulfill(json(options.config ?? defaultConfig)),
  );
  await page.route("**/management-tool/ui/config/plugins.json", (route) =>
    route.fulfill(json({ plugins: [] })),
  );
  // The full /info/me.json shape, not just `user`: the upload service builds the
  // episode ACL from `org.adminRole` and `userRole`, and a partial document
  // stalls the ingest chain silently after addDCCatalog — no error, no progress.
  await page.route("**/info/me.json", (route) =>
    route.fulfill(
      json({
        org: {
          id: "mh_default_org",
          name: "Mock Organization",
          adminRole: "ROLE_ADMIN",
          properties: {},
        },
        roles: user?.roles ?? [],
        userRole: user ? `ROLE_USER_${user.username.toUpperCase()}` : "",
        user: user
          ? {
              provider: "opencast",
              name: user.name,
              email: user.email,
              username: user.username,
            }
          : null,
      }),
    ),
  );
  await page.route("https://api.github.com/**", (route) =>
    route.fulfill(json({ tag_name: "v0.0.0" })),
  );
  await page.route("https://www.gravatar.com/**", (route) =>
    route.fulfill({ status: 200, contentType: "image/png", body: Buffer.from([]) }),
  );
  // Thumbnails and player links point at a host that doesn't exist; answering
  // them keeps "failed to load resource" out of the console-error assertions.
  await page.route("https://example.invalid/**", (route) =>
    route.fulfill({ status: 200, contentType: "image/png", body: Buffer.from([]) }),
  );

  // ── Opencast ingest (REST, not GraphQL) ──────────────────────────────────
  // The upload plugin talks to /ingest/* and threads an opaque mediapackage XML
  // document from call to call; nothing in the UI parses it, so a minimal
  // well-formed document is enough. `addTrack` goes through XMLHttpRequest for
  // progress reporting — Playwright intercepts that the same way.
  const mediaPackageXml =
    '<mediapackage xmlns="http://mediapackage.opencastproject.org" ' +
    'id="mock-mediapackage" start="2026-01-01T00:00:00Z"></mediapackage>';

  await page.route("**/ingest/**", async (route: Route) => {
    const url = new URL(route.request().url());
    const endpoint = url.pathname.split("/").pop() ?? "";
    backend.ingestCalls.push({ endpoint, body: route.request().postData() ?? "" });

    // Hold the track upload open so the in-flight state (per-file progress bar)
    // is observable; a byte-sized fixture would otherwise finish between frames.
    if (endpoint === "addTrack" && backend.trackUploadDelayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, backend.trackUploadDelayMs));
    }
    await route.fulfill({
      status: 200,
      contentType: "text/xml",
      body: endpoint === "ingest" ? "<workflow />" : mediaPackageXml,
    });
  });

  await page.route("**/graphql", async (route: Route) => {
    let body: { operationName?: string; query?: string; variables?: Record<string, unknown> } = {};
    try {
      body = JSON.parse(route.request().postData() ?? "{}");
    } catch {
      /* fall through to the empty default */
    }
    const operationName =
      body.operationName ?? /\b(?:query|mutation)\s+(\w+)/.exec(body.query ?? "")?.[1] ?? "unknown";
    const variables = body.variables ?? {};
    backend.calls.push({ operationName, variables });

    const respond = (data: unknown) => route.fulfill(json({ data }));

    switch (operationName) {
      case "MuiUser":
      case "MuiGetCurrentUser":
        // `user: null` has to yield a null currentUser, not an object full of
        // nulls — the shell treats the presence of the object as "signed in",
        // so the object form makes a signed-out run indistinguishable.
        return respond({
          currentUser: user
            ? {
                __typename: "CurrentUser",
                username: user.username,
                name: user.name,
                email: user.email,
              }
            : null,
        });

      case "MuiGetMySeries":
      case "MuiGetMySeriesNameAndId": {
        const filtered = backend.series.filter((s) =>
          matchesQuery([s.title, s.description, s.creator], variables["query"]),
        );
        const ordered = applyOrderBy(
          filtered as unknown as Record<string, unknown>[],
          variables["orderBy"],
        ) as unknown as MockSeries[];
        const page_ = paginate(ordered, variables);
        return respond({
          currentUser: {
            mySeries: { totalCount: page_.totalCount, nodes: page_.nodes.map(seriesNode) },
          },
        });
      }

      case "MuiGetMyEvents": {
        const filtered = backend.events.filter((e) =>
          matchesQuery([e.title, e.seriesName ?? "", e.creator, e.location], variables["query"]),
        );
        const ordered = applyOrderBy(
          filtered as unknown as Record<string, unknown>[],
          variables["orderBy"],
        ) as unknown as MockEvent[];
        const page_ = paginate(ordered, variables);
        return respond({
          currentUser: {
            myEvents: { totalCount: page_.totalCount, nodes: page_.nodes.map(eventNode) },
          },
        });
      }

      case "MuiEventsFromSeries": {
        // The per-series video list uses its own query, not MuiGetMyEvents —
        // without it the "episode count" navigation lands on an empty table.
        const filtered = backend.events
          .filter((e) => e.seriesId === variables["seriesId"])
          .filter((e) => matchesQuery([e.title, e.creator, e.location], variables["query"]));
        const page_ = paginate(filtered, variables);
        return respond({
          seriesById: {
            id: variables["seriesId"],
            title: backend.series.find((s) => s.id === variables["seriesId"])?.title ?? null,
            events: { totalCount: page_.totalCount, nodes: page_.nodes.map(eventNode) },
          },
        });
      }

      case "MuiGetSeriesNameById": {
        const target = backend.series.find((s) => s.id === variables["seriesId"]);
        return respond({ seriesById: target ? { title: target.title } : null });
      }

      case "MuiGetSeriesByIdInputFields": {
        const target = backend.series.find((s) => s.id === variables["seriesId"]);
        return respond({
          seriesById: target ? { commonMetadataV2: seriesMetadata(target) } : null,
        });
      }

      case "MuiGetSeriesInfo": {
        const target = backend.series.find((s) => s.id === variables["seriesId"]);
        return respond({ seriesById: target ? seriesNode(target) : null });
      }

      case "MuiUpdateSeries": {
        const target = backend.series.find((s) => s.id === variables["seriesId"]);
        const metadata = (variables["metadata"] ?? {}) as Partial<MockSeries>;
        if (target) Object.assign(target, metadata);
        return respond({ updateSeries: target ? seriesNode(target) : null });
      }

      case "MuiGetEventByIdInputFields": {
        const target = backend.events.find((e) => e.id === variables["eventId"]);
        return respond({ eventById: target ? { commonMetadataV2: eventMetadata(target) } : null });
      }

      case "MuiGetEventById": {
        const target = backend.events.find((e) => e.id === variables["eventId"]);
        return respond({ eventById: target ? { id: target.id, title: target.title } : null });
      }

      case "MuiUpdateEvent": {
        const target = backend.events.find((e) => e.id === variables["eventId"]);
        const metadata = (variables["metadata"] ?? {}) as Partial<MockEvent>;
        if (target) Object.assign(target, metadata);
        return respond({ mui: { updateEvent: target ? eventNode(target) : null } });
      }

      case "MuiDeleteEvent": {
        const index = backend.events.findIndex((e) => e.id === variables["eventId"]);
        const removed = index >= 0 ? backend.events.splice(index, 1)[0] : undefined;
        return respond({ mui: { deleteEvent: removed ? { id: removed.id } : null } });
      }

      // Everything else the shell probes during boot (ACLs, metadata field
      // definitions, per-item detail queries) is not what these specs assert on.
      default:
        return respond(null);
    }
  });

  return backend;
}
