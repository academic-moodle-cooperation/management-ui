import { describe, expect, it } from "vitest";

import { lightnessOf, pickPaperToken } from "./paper";

describe("paper token", () => {
  it("reads lightness from oklch and rgb", () => {
    expect(lightnessOf("oklch(0.99 0.005 85)")).toBeCloseTo(0.99);
    expect(lightnessOf("oklch(22% 0.006 80)")).toBeCloseTo(0.22);
    expect(lightnessOf("rgb(255, 255, 255)")).toBeCloseTo(1);
    expect(lightnessOf("color(srgb 0 0 0)")).toBe(0);
    expect(lightnessOf("nonsense")).toBeNull();
  });

  it("picks the lighter of primary-foreground and primary", () => {
    // warm theme: terracotta primary, near-white foreground
    expect(pickPaperToken("oklch(0.99 0.005 85)", "oklch(0.68 0.12 40)")).toBe("--primary-foreground");
    // plain dark theme: white primary, near-black foreground
    expect(pickPaperToken("rgb(20, 20, 20)", "rgb(250, 250, 250)")).toBe("--primary");
    expect(pickPaperToken("weird", "rgb(0,0,0)")).toBe("--primary-foreground");
  });
});
