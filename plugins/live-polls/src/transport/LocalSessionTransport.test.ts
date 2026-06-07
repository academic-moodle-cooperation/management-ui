import { beforeEach, describe, expect, it, vi } from "vitest";

import { LocalSessionTransport } from "./LocalSessionTransport";

import type { Deck, SessionEvent } from "../types";


const deck: Deck = { id: "d1", title: "T", questions: [], createdAt: 0, updatedAt: 0 };
const opened: SessionEvent = { type: "session-opened", deck, at: 1 };

describe("LocalSessionTransport", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("persists appended events and reports existence", () => {
    const transport = new LocalSessionTransport();
    expect(transport.exists("ABC")).toBe(false);

    const channel = transport.open("ABC");
    channel.append(opened);

    expect(transport.exists("ABC")).toBe(true);
    expect(channel.getEvents()).toEqual([opened]);
    channel.dispose();
  });

  it("notifies same-tab siblings and replays the log to late joiners", () => {
    const transport = new LocalSessionTransport();
    const presenter = transport.open("XYZ");
    const listener = vi.fn();
    presenter.subscribe(listener);

    const participant = transport.open("XYZ");
    participant.append({ type: "participant-joined", participant: { id: "p1", name: "Ann" }, at: 2 });

    // Sibling in the same tab heard the change…
    expect(listener).toHaveBeenCalled();
    expect(presenter.getEvents()).toHaveLength(1);

    // …and a brand-new handle replays the full log on open.
    const lateJoiner = transport.open("XYZ");
    expect(lateJoiner.getEvents()).toHaveLength(1);

    presenter.dispose();
    participant.dispose();
    lateJoiner.dispose();
  });

  it("keeps separate logs per join code", () => {
    const transport = new LocalSessionTransport();
    const a = transport.open("AAA");
    const b = transport.open("BBB");
    a.append(opened);

    expect(a.getEvents()).toHaveLength(1);
    expect(b.getEvents()).toHaveLength(0);
    a.dispose();
    b.dispose();
  });
});
