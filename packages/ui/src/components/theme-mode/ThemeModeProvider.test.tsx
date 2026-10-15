import { act, render, renderHook, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { THEME_MODE_STORAGE_KEY, useThemeMode } from "./theme-mode-context";
import { ThemeModeProvider } from "./ThemeModeProvider";

const DARK_QUERY = "(prefers-color-scheme: dark)";

/**
 * jsdom ships no `matchMedia`. This stub answers the dark-scheme query from
 * `osPrefersDark` and lets a test flip the OS preference at runtime by
 * dispatching to the registered `change` listeners.
 */
let osPrefersDark = false;
let changeListeners: Array<(event: MediaQueryListEvent) => void> = [];

function setOsPrefersDark(dark: boolean) {
  osPrefersDark = dark;
  changeListeners.forEach((listener) => listener({ matches: dark } as MediaQueryListEvent));
}

function Probe() {
  const { theme, resolvedTheme, systemTheme } = useThemeMode();
  return <output>{`${theme}/${resolvedTheme}/${systemTheme}`}</output>;
}

const htmlClass = () => document.documentElement.className;

describe("ThemeModeProvider", () => {
  beforeEach(() => {
    osPrefersDark = false;
    changeListeners = [];
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      configurable: true,
      value: vi.fn((query: string) => ({
        get matches() {
          return query === DARK_QUERY && osPrefersDark;
        },
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn((event: string, cb: (e: MediaQueryListEvent) => void) => {
          if (event === "change") changeListeners.push(cb);
        }),
        removeEventListener: vi.fn((_: string, cb: (e: MediaQueryListEvent) => void) => {
          changeListeners = changeListeners.filter((l) => l !== cb);
        }),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  afterEach(() => {
    document.documentElement.className = "";
    document.documentElement.style.colorScheme = "";
    // The transition-suppressing <style> is removed on a 1ms timer; do not
    // let one test's leftover leak into the next.
    document.head.querySelectorAll("style").forEach((style) => style.remove());
  });

  it("defaults to the OS preference and applies it as a class on <html>", () => {
    osPrefersDark = true;
    render(
      <ThemeModeProvider>
        <Probe />
      </ThemeModeProvider>,
    );
    expect(screen.getByRole("status").textContent).toBe("system/dark/dark");
    expect(htmlClass()).toBe("dark");
    expect(document.documentElement.style.colorScheme).toBe("dark");
  });

  it("honours a choice persisted under next-themes' storage key", () => {
    osPrefersDark = true;
    localStorage.setItem(THEME_MODE_STORAGE_KEY, "light");
    render(
      <ThemeModeProvider>
        <Probe />
      </ThemeModeProvider>,
    );
    expect(screen.getByRole("status").textContent).toBe("light/light/dark");
    expect(htmlClass()).toBe("light");
  });

  it("falls back to system when the stored value is not a theme mode", () => {
    localStorage.setItem(THEME_MODE_STORAGE_KEY, "sepia");
    render(
      <ThemeModeProvider>
        <Probe />
      </ThemeModeProvider>,
    );
    expect(screen.getByRole("status").textContent).toBe("system/light/light");
    expect(htmlClass()).toBe("light");
  });

  it("setTheme swaps the class, persists the choice and resolves it", () => {
    const { result } = renderHook(() => useThemeMode(), { wrapper: ThemeModeProvider });
    expect(htmlClass()).toBe("light");

    act(() => result.current.setTheme("dark"));

    expect(result.current.theme).toBe("dark");
    expect(result.current.resolvedTheme).toBe("dark");
    expect(htmlClass()).toBe("dark");
    expect(localStorage.getItem(THEME_MODE_STORAGE_KEY)).toBe("dark");
  });

  it("follows OS changes while the choice is system, but not otherwise", () => {
    const { result } = renderHook(() => useThemeMode(), { wrapper: ThemeModeProvider });
    expect(htmlClass()).toBe("light");

    act(() => setOsPrefersDark(true));
    expect(result.current.resolvedTheme).toBe("dark");
    expect(htmlClass()).toBe("dark");

    act(() => result.current.setTheme("light"));
    act(() => setOsPrefersDark(false));
    act(() => setOsPrefersDark(true));
    expect(result.current.systemTheme).toBe("dark");
    expect(result.current.resolvedTheme).toBe("light");
    expect(htmlClass()).toBe("light");
  });

  it("picks up a choice made in another tab", () => {
    const { result } = renderHook(() => useThemeMode(), { wrapper: ThemeModeProvider });

    act(() => {
      window.dispatchEvent(
        new StorageEvent("storage", { key: THEME_MODE_STORAGE_KEY, newValue: "dark" }),
      );
    });
    expect(result.current.theme).toBe("dark");
    expect(htmlClass()).toBe("dark");

    act(() => {
      window.dispatchEvent(
        new StorageEvent("storage", { key: THEME_MODE_STORAGE_KEY, newValue: null }),
      );
    });
    expect(result.current.theme).toBe("system");
  });

  it("leaves an appearance the host bootstrap already applied untouched", () => {
    // The shell's index.html applies the class before React mounts; the
    // provider must not re-apply it (which would also inject the
    // transition-suppressing <style>).
    osPrefersDark = true;
    document.documentElement.classList.add("dark");
    document.documentElement.style.colorScheme = "dark";
    const stylesBefore = document.head.querySelectorAll("style").length;
    render(<ThemeModeProvider>{null}</ThemeModeProvider>);
    expect(htmlClass()).toBe("dark");
    expect(document.head.querySelectorAll("style")).toHaveLength(stylesBefore);
  });

  it("renders no <script> into the React tree", () => {
    // React ≥ 19.2 logs "Encountered a script tag while rendering React
    // component" — the reason the next-themes wrapper was replaced.
    const { container } = render(<ThemeModeProvider>{null}</ThemeModeProvider>);
    expect(container.querySelector("script")).toBeNull();
  });

  it("useThemeMode is safe without a provider", () => {
    const { result } = renderHook(() => useThemeMode());
    expect(result.current.theme).toBe("system");
    expect(() => result.current.setTheme("dark")).not.toThrow();
    expect(htmlClass()).toBe("");
  });
});
