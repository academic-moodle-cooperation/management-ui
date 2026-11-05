import { useSyncExternalStore } from "react";

function subscribe(onChange: () => void): () => void {
  if (typeof document === "undefined") return () => {};
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => observer.disconnect();
}

function snapshot(): boolean {
  return typeof document !== "undefined" && document.documentElement.classList.contains("dark");
}

/** Whether the shell currently renders in dark mode (the `.dark` class on <html>). */
export function useIsDark(): boolean {
  return useSyncExternalStore(subscribe, snapshot, () => false);
}
