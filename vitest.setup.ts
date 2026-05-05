import "@testing-library/jest-dom";
import { expect, afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// Node 25 ships a global `localStorage` that requires `--localstorage-file`;
// without that flag it surfaces as `{}` and shadows jsdom's working Storage.
// Install a small in-memory replacement so any code that touches localStorage
// (e.g. admin-marketplace's RemoteLoader) gets a fully functional Storage.
const memoryStore = new Map<string, string>();
const memoryLocalStorage: Storage = {
  get length() {
    return memoryStore.size;
  },
  clear: () => memoryStore.clear(),
  getItem: (key) => (memoryStore.has(key) ? (memoryStore.get(key) ?? null) : null),
  key: (index) => Array.from(memoryStore.keys())[index] ?? null,
  removeItem: (key) => {
    memoryStore.delete(key);
  },
  setItem: (key, value) => {
    memoryStore.set(key, String(value));
  },
};
Object.defineProperty(globalThis, "localStorage", {
  value: memoryLocalStorage,
  writable: true,
  configurable: true,
});
afterEach(() => memoryLocalStorage.clear());

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Extend Vitest's expect with jest-dom matchers
expect.extend({
  // Add custom matchers here if needed
});
