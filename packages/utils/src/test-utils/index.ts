/**
 * Test utilities for the Management UI monorepo
 *
 * Provides common testing helpers and utilities that can be shared across packages.
 */

import { vi, type Mock } from "vitest";

/**
 * Creates a mock implementation that can be used in tests
 */
export function createMock<T extends (...args: unknown[]) => unknown>(implementation?: T): Mock<T> {
  return vi.fn(implementation) as Mock<T>;
}

/**
 * Waits for a specified amount of time (useful for async testing)
 */
export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Creates a promise that resolves after the next tick
 * Uses setTimeout(0) as a browser-compatible alternative to process.nextTick
 */
export function nextTick(): Promise<void> {
  return new Promise((resolve) => {
    // Use setTimeout(0) as a browser-compatible alternative to process.nextTick
    setTimeout(resolve, 0);
  });
}

/**
 * Helper to create test data factories
 */
export function createFactory<T>(defaults: Partial<T> = {}): (overrides?: Partial<T>) => T {
  return (overrides = {}) => ({ ...defaults, ...overrides }) as T;
}
