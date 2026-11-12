/**
 * The "paper" of the generated artwork — the bright window on the accent
 * gradient (V4). No theme token is guaranteed to be light in both modes:
 * under a warm theme `--primary-foreground` is near-white, under a plain dark
 * theme `--primary` is. So pick whichever of the two is lighter, by reading
 * the computed values and comparing their lightness.
 */

/** Perceived lightness 0..1 of a computed CSS color, or null when unparsable. */
export function lightnessOf(color: string): number | null {
  const c = color.trim();
  let m = /^oklch\(\s*([\d.]+)(%?)/i.exec(c);
  if (m) {
    const l = Number(m[1]);
    return m[2] ? l / 100 : l;
  }
  m = /^(?:rgba?|color\(srgb)\s*\(?\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i.exec(c);
  if (m) {
    const [r, g, b] = [m[1], m[2], m[3]].map((v) => {
      const n = Number(v);
      return n > 1 ? n / 255 : n;
    }) as [number, number, number];
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }
  return null;
}

/** Which token to draw paper with: the lighter of primary-foreground and primary. */
export function pickPaperToken(primaryForeground: string, primary: string): "--primary-foreground" | "--primary" {
  const fg = lightnessOf(primaryForeground);
  const pr = lightnessOf(primary);
  if (fg === null || pr === null) return "--primary-foreground";
  return fg >= pr ? "--primary-foreground" : "--primary";
}

/** Read the live tokens from the document; falls back to primary-foreground. */
export function currentPaperToken(): "--primary-foreground" | "--primary" {
  if (typeof document === "undefined") return "--primary-foreground";
  const root = document.documentElement;
  const probe = document.createElement("span");
  probe.style.position = "absolute";
  probe.style.visibility = "hidden";
  root.appendChild(probe);
  try {
    probe.style.color = "var(--primary-foreground)";
    const fg = getComputedStyle(probe).color;
    probe.style.color = "var(--primary)";
    const pr = getComputedStyle(probe).color;
    return pickPaperToken(fg, pr);
  } finally {
    probe.remove();
  }
}
