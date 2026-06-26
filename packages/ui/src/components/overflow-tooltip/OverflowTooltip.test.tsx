import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { OverflowTooltip } from "./OverflowTooltip";

// jsdom never lays elements out, so the size getters return 0. Drive them from a
// mutable record the test can flip between renders to emulate a fallback -> web
// font swap (the real-world trigger for the latched-underline bug).
const SIZE_PROPS = ["clientHeight", "scrollHeight", "clientWidth", "scrollWidth"] as const;
type SizeProp = (typeof SIZE_PROPS)[number];

let metrics: Record<SizeProp, number>;
const originalDescriptors: Partial<Record<SizeProp, PropertyDescriptor | undefined>> = {};
let resolveFontsReady: () => void;

beforeEach(() => {
  metrics = { clientHeight: 32, scrollHeight: 32, clientWidth: 200, scrollWidth: 200 };
  for (const prop of SIZE_PROPS) {
    originalDescriptors[prop] = Object.getOwnPropertyDescriptor(HTMLElement.prototype, prop);
    Object.defineProperty(HTMLElement.prototype, prop, {
      configurable: true,
      get() {
        return metrics[prop];
      },
    });
  }
  const ready = new Promise<void>((resolve) => {
    resolveFontsReady = resolve;
  });
  Object.defineProperty(document, "fonts", { configurable: true, value: { ready } });
});

afterEach(() => {
  for (const prop of SIZE_PROPS) {
    const original = originalDescriptors[prop];
    if (original) {
      Object.defineProperty(HTMLElement.prototype, prop, original);
    } else {
      delete (HTMLElement.prototype as unknown as Record<string, unknown>)[prop];
    }
  }
});

describe("OverflowTooltip", () => {
  it("does not underline content that fits", () => {
    render(<OverflowTooltip>Fits fine</OverflowTooltip>);
    expect(screen.getByText("Fits fine").classList.contains("underline")).toBe(false);
  });

  it("clears a false vertical-overflow underline once web fonts finish loading", async () => {
    // First measurement runs against a fallback font: a clamped cell reports a
    // vertical overflow it would not have once the real font is applied.
    metrics.scrollHeight = 48; // exceeds clientHeight (32)
    render(<OverflowTooltip>Latched line</OverflowTooltip>);
    await waitFor(() =>
      expect(screen.getByText("Latched line").classList.contains("underline")).toBe(true),
    );

    // The real font swaps in and the cell now fits. Resolving fonts.ready must
    // re-measure and drop the underline — the bug was that it latched forever.
    metrics.scrollHeight = 32;
    resolveFontsReady();
    await waitFor(() =>
      expect(screen.getByText("Latched line").classList.contains("underline")).toBe(false),
    );
  });
});
