import { PluginManager, Plugin } from "@workspace/plugin-system";

const STORAGE_KEY = "installed_remote_plugins";

/**
 * RemoteLoader Service
 *
 * Handles dynamic loading and registration of remote ES module plugins.
 * Supports "Parallel Engine" approach - remote plugins are loaded and
 * registered with the existing PluginManager at runtime.
 */
export const RemoteLoader = {
  /**
   * Dynamically import and register a remote plugin module
   * @param url - URL to the remote ES module
   * @param manager - PluginManager instance to register the plugin with
   */
  async loadAndRegister(url: string, manager: PluginManager): Promise<void> {
    try {
      const module = await import(/* @vite-ignore */ url);
      const remotePlugin: Plugin = module.default;
      
      if (!remotePlugin || typeof remotePlugin.initialize !== "function") {
        throw new Error("Invalid plugin format: must export a default plugin object with initialize method");
      }
      
      manager.register(remotePlugin);
    } catch (error) {
      console.error(`Failed to load plugin from ${url}`, error);
      throw error;
    }
  },

  /**
   * Persist a plugin URL to localStorage
   * @param url - URL to persist
   */
  persist(url: string) {
    const installed = this.getInstalledUrls();
    if (!installed.includes(url)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...installed, url]));
    }
  },

  /**
   * Remove a plugin URL from localStorage
   * @param url - URL to remove
   */
  remove(url: string) {
    const installed = this.getInstalledUrls();
    const filtered = installed.filter((u) => u !== url);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  },

  /**
   * Get all installed plugin URLs from localStorage
   * @returns Array of plugin URLs
   */
  getInstalledUrls(): string[] {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  },

  /**
   * Clear all installed plugin URLs from localStorage
   */
  clearAll() {
    localStorage.removeItem(STORAGE_KEY);
  },
};
