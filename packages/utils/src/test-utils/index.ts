/**
 * Test utilities for the Management UI monorepo
 * 
 * Provides common testing helpers and utilities that can be shared across packages.
 */

/**
 * Creates a mock implementation that can be used in tests
 */
export function createMock<T extends (...args: unknown[]) => unknown>(
  implementation?: T
): jest.Mock<T> {
  return jest.fn(implementation) as jest.Mock<T>;
}

/**
 * Waits for a specified amount of time (useful for async testing)
 */
export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Creates a promise that resolves after the next tick
 */
export function nextTick(): Promise<void> {
  return new Promise((resolve) => process.nextTick(resolve));
}

/**
 * Helper to create test data factories
 */
export function createFactory<T>(
  defaults: Partial<T> = {}
): (overrides?: Partial<T>) => T {
  return (overrides = {}) => ({ ...defaults, ...overrides } as T);
}
