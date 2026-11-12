import { afterEach } from "vitest";

// Node 25 ships a global `localStorage` that requires `--localstorage-file`;
// without that flag it surfaces as `{}` and shadows a working Storage. Install
// a small in-memory replacement so any code touched by the contract harness
// that reads/writes localStorage (config, store, …) gets a real Storage.
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
