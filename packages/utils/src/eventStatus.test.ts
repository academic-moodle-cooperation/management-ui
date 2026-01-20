/**
 * Tests for event status utility functions
 */

import { describe, expect, it } from "vitest";

import { getEventStatus, hasProcessingEvents, isEventProcessing } from "./eventStatus.js";

describe("getEventStatus", () => {
  it("should extract status from event status string", () => {
    expect(getEventStatus("EVENTS.EVENTS.STATUS.PROCESSING")).toBe("PROCESSING");
    expect(getEventStatus("EVENTS.EVENTS.STATUS.PENDING")).toBe("PENDING");
    expect(getEventStatus("EVENTS.EVENTS.STATUS.PROCESSED")).toBe("PROCESSED");
  });

  it("should handle simple status strings", () => {
    expect(getEventStatus("PROCESSING")).toBe("PROCESSING");
    expect(getEventStatus("PENDING")).toBe("PENDING");
  });

  it("should return null for invalid input", () => {
    expect(getEventStatus(undefined)).toBe(null);
    expect(getEventStatus(null)).toBe(null);
    expect(getEventStatus("")).toBe(null);
  });
});

describe("isEventProcessing", () => {
  it("should return true for processing states", () => {
    expect(isEventProcessing("EVENTS.EVENTS.STATUS.PROCESSING")).toBe(true);
    expect(isEventProcessing("EVENTS.EVENTS.STATUS.PENDING")).toBe(true);
    expect(isEventProcessing("EVENTS.EVENTS.STATUS.PROCESSING_FAILURE")).toBe(true);
  });

  it("should return false for non-processing states", () => {
    expect(isEventProcessing("EVENTS.EVENTS.STATUS.PROCESSED")).toBe(false);
    expect(isEventProcessing("EVENTS.EVENTS.STATUS.SUCCEEDED")).toBe(false);
  });

  it("should handle lowercase status strings", () => {
    expect(isEventProcessing("events.events.status.processing")).toBe(true);
    expect(isEventProcessing("events.events.status.pending")).toBe(true);
  });

  it("should return false for invalid input", () => {
    expect(isEventProcessing(undefined)).toBe(false);
    expect(isEventProcessing(null)).toBe(false);
    expect(isEventProcessing("")).toBe(false);
  });
});

describe("hasProcessingEvents", () => {
  it("should return true when at least one event is processing", () => {
    const events = [
      { eventStatus: "EVENTS.EVENTS.STATUS.PROCESSED" },
      { eventStatus: "EVENTS.EVENTS.STATUS.PROCESSING" },
      { eventStatus: "EVENTS.EVENTS.STATUS.PROCESSED" },
    ];
    expect(hasProcessingEvents(events)).toBe(true);
  });

  it("should return false when no events are processing", () => {
    const events = [
      { eventStatus: "EVENTS.EVENTS.STATUS.PROCESSED" },
      { eventStatus: "EVENTS.EVENTS.STATUS.SUCCEEDED" },
      { eventStatus: "EVENTS.EVENTS.STATUS.PROCESSED" },
    ];
    expect(hasProcessingEvents(events)).toBe(false);
  });

  it("should return true for PENDING events", () => {
    const events = [{ eventStatus: "EVENTS.EVENTS.STATUS.PENDING" }];
    expect(hasProcessingEvents(events)).toBe(true);
  });

  it("should return true for PROCESSING_FAILURE events", () => {
    const events = [{ eventStatus: "EVENTS.EVENTS.STATUS.PROCESSING_FAILURE" }];
    expect(hasProcessingEvents(events)).toBe(true);
  });

  it("should handle empty arrays", () => {
    expect(hasProcessingEvents([])).toBe(false);
  });

  it("should handle null/undefined input", () => {
    expect(hasProcessingEvents(null)).toBe(false);
    expect(hasProcessingEvents(undefined)).toBe(false);
  });

  it("should handle arrays with null events", () => {
    const events = [null, { eventStatus: "EVENTS.EVENTS.STATUS.PROCESSING" }, null];
    expect(hasProcessingEvents(events)).toBe(true);
  });

  it("should handle events without eventStatus", () => {
    const events = [
      { eventStatus: undefined },
      { eventStatus: "EVENTS.EVENTS.STATUS.PROCESSING" },
    ];
    expect(hasProcessingEvents(events)).toBe(true);
  });
});
