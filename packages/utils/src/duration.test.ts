import { describe, it, expect } from "vitest";
import { parseDuration, serializeDuration } from "./index";

describe("parseDuration", () => {
  it("should parse ISO 8601 duration string to HH:MM:SS format", () => {
    expect(parseDuration("PT1H30M45S")).toBe("01:30:45");
  });

  it("should handle hours only", () => {
    expect(parseDuration("PT2H")).toBe("02:00:00");
  });

  it("should handle minutes only", () => {
    expect(parseDuration("PT30M")).toBe("00:30:00");
  });

  it("should handle seconds only", () => {
    expect(parseDuration("PT45S")).toBe("00:00:45");
  });

  it("should handle zero duration", () => {
    expect(parseDuration("PT0S")).toBe("00:00:00");
  });

  it("should handle undefined input", () => {
    expect(parseDuration(undefined)).toBe("00:00:00");
  });

  it("should pad single digit values with zeros", () => {
    expect(parseDuration("PT1H5M3S")).toBe("01:05:03");
  });

  it("should round seconds to nearest integer", () => {
    expect(parseDuration("PT1H30M45.7S")).toBe("01:30:46");
  });
});

describe("serializeDuration", () => {
  it("should serialize duration object to ISO 8601 string", () => {
    const duration = {
      hours: 1,
      minutes: 30,
      seconds: 45,
    };
    const result = serializeDuration(duration);
    expect(result).toContain("PT");
    expect(result).toContain("H");
    expect(result).toContain("M");
    expect(result).toContain("S");
  });

  it("should handle zero values", () => {
    const duration = {
      hours: 0,
      minutes: 0,
      seconds: 0,
    };
    const result = serializeDuration(duration);
    expect(result).toBe("PT0S");
  });
});
