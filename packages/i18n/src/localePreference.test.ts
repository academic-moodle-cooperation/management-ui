import { describe, it, expect, beforeEach, vi } from "vitest";

// See dateFormat.test.ts — the real `./index` cannot boot in a node
// environment; the language state is all these helpers touch.
const mocked = vi.hoisted(() => ({
  i18next: {
    resolvedLanguage: "en" as string | undefined,
    options: {} as { lng?: string },
    changeLanguage: vi.fn(async (language: string) => {
      mocked.i18next.resolvedLanguage = language;
    }),
  },
}));
vi.mock("./index", () => mocked);

import { applyConfiguredLanguage, getUserLanguage, setUserLanguage } from "./localePreference";

/** Minimal localStorage; `failing` reproduces private-mode / disabled storage. */
const storage = (failing = false) => {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => {
      if (failing) throw new Error("storage disabled");
      return store.get(key) ?? null;
    },
    setItem: (key: string, value: string) => {
      if (failing) throw new Error("storage disabled");
      store.set(key, value);
    },
  };
};

describe("locale preference", () => {
  beforeEach(() => {
    mocked.i18next.resolvedLanguage = "en";
    mocked.i18next.options = {};
    mocked.i18next.changeLanguage.mockClear();
    vi.stubGlobal("window", { localStorage: storage() });
  });

  it("applies the configured locale when the user never picked one", async () => {
    await applyConfiguredLanguage("de");

    expect(mocked.i18next.changeLanguage).toHaveBeenCalledWith("de");
    expect(getUserLanguage()).toBeNull();
  });

  it("leaves the language alone when the user has chosen", async () => {
    await setUserLanguage("en");
    mocked.i18next.changeLanguage.mockClear();

    await applyConfiguredLanguage("de");

    expect(mocked.i18next.changeLanguage).not.toHaveBeenCalled();
    expect(getUserLanguage()).toBe("en");
  });

  it("does nothing without a configured locale, or when it is already active", async () => {
    await applyConfiguredLanguage(undefined);
    await applyConfiguredLanguage("en");

    expect(mocked.i18next.changeLanguage).not.toHaveBeenCalled();
  });

  it("still switches the language when storage is unavailable", async () => {
    vi.stubGlobal("window", { localStorage: storage(true) });

    await expect(setUserLanguage("de")).resolves.toBeUndefined();
    expect(mocked.i18next.changeLanguage).toHaveBeenCalledWith("de");
    // The choice cannot be remembered, so the configured default wins again
    // on the next load — the language still switched for this session.
    expect(getUserLanguage()).toBeNull();
  });
});
