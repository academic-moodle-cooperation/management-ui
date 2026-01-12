import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createPluginManager } from './pluginManager';
import type { Plugin } from './IPlugin';

describe('PluginManager', () => {
  let manager: ReturnType<typeof createPluginManager>;

  beforeEach(() => {
    manager = createPluginManager();
  });

  describe('register', () => {
    it('should register a plugin successfully', () => {
      const plugin: Plugin = {
        name: 'test:plugin',
        version: '1.0.0',
        activate: vi.fn(),
        deactivate: vi.fn(),
      };

      manager.register(plugin);

      expect(manager.plugins.has('test:plugin')).toBe(true);
      expect(plugin.activate).toHaveBeenCalled();
    });

    it('should warn but still register plugin with legacy name format (backward compatibility)', () => {
      const plugin: Plugin = {
        name: 'legacy-plugin-name',
        version: '1.0.0',
        activate: vi.fn(),
        deactivate: vi.fn(),
      };

      manager.register(plugin);

      // Legacy names are still registered for backward compatibility
      expect(manager.plugins.has('legacy-plugin-name')).toBe(true);
    });

    it('should not register plugin with completely invalid name format', () => {
      const plugin: Plugin = {
        name: 'invalid:name:with:too:many:colons',
        version: '1.0.0',
        activate: vi.fn(),
        deactivate: vi.fn(),
      };

      manager.register(plugin);

      // Invalid format (too many colons) should not be registered
      expect(manager.plugins.has('invalid:name:with:too:many:colons')).toBe(false);
    });

    it('should not register duplicate plugins', () => {
      const plugin: Plugin = {
        name: 'test:plugin',
        version: '1.0.0',
        activate: vi.fn(),
        deactivate: vi.fn(),
      };

      manager.register(plugin);
      manager.register(plugin);

      expect(manager.plugins.size).toBe(1);
    });
  });

  describe('deregister', () => {
    it('should deregister a plugin', () => {
      const plugin: Plugin = {
        name: 'test:plugin',
        version: '1.0.0',
        activate: vi.fn(),
        deactivate: vi.fn(),
      };

      manager.register(plugin);
      manager.deregister('test:plugin');

      expect(manager.plugins.has('test:plugin')).toBe(false);
      expect(plugin.deactivate).toHaveBeenCalled();
    });
  });

  describe('functions', () => {
    it('should add and execute functions', () => {
      const testFn = vi.fn((x: number) => x * 2);
      manager.addFunction('test:multiply', testFn);

      const result = manager.executeFunction<number>('test:multiply', 5);

      expect(result).toBe(10);
      expect(testFn).toHaveBeenCalledWith(5);
    });
  });

  describe('events', () => {
    it('should dispatch and listen to events', () => {
      const callback = vi.fn();
      manager.addEventListener('test:event', callback);

      manager.dispatchEvent('test:event', { data: 'test' });

      expect(callback).toHaveBeenCalledWith({ data: 'test' });
    });
  });
});
