import { useSyncExternalStore } from "react";

import { currentPaperToken } from "../lib/paper";

type PaperToken = "--primary-foreground" | "--primary";

let cached: PaperToken | null = null;
const listeners = new Set<() => void>();
let observer: MutationObserver | null = null;

function refresh(): void {
  const next = currentPaperToken();
  if (next !== cached) {
    cached = next;
    listeners.forEach((l) => l());
  }
}

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  if (!observer && typeof document !== "undefined") {
    // Theme changes arrive as a class flip on <html> or a stylesheet <link>
    // added/removed in <head> (shell theme loader, marketplace theme preview).
    observer = new MutationObserver(() => refresh());
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "data-theme"] });
    observer.observe(document.head, { childList: true });
  }
  return () => {
    listeners.delete(onChange);
    if (listeners.size === 0 && observer) {
      observer.disconnect();
      observer = null;
    }
  };
}

function snapshot(): PaperToken {
  if (cached === null) cached = currentPaperToken();
  return cached;
}

/** The token the artwork paper should use under the live theme (see lib/paper.ts). */
export function usePaperToken(): PaperToken {
  return useSyncExternalStore(subscribe, snapshot, () => "--primary-foreground");
}
