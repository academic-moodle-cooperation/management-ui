import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logger, Logger } from './logger';

describe('Logger', () => {
  let consoleSpy: {
    debug: ReturnType<typeof vi.spyOn>;
    info: ReturnType<typeof vi.spyOn>;
    warn: ReturnType<typeof vi.spyOn>;
    error: ReturnType<typeof vi.spyOn>;
  };

  beforeEach(() => {
    consoleSpy = {
      debug: vi.spyOn(console, 'debug').mockImplementation(() => {}),
      info: vi.spyOn(console, 'info').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
    };
  });

  afterEach(() => {
    Object.values(consoleSpy).forEach((spy) => spy.mockRestore());
  });

  describe('warn', () => {
    it('should log warn messages', () => {
      logger.warn('Test warn message', { key: 'value' });

      expect(consoleSpy.warn).toHaveBeenCalledWith(
        '[WARN] Test warn message',
        { key: 'value' }
      );
    });
  });

  describe('error', () => {
    it('should log error messages with Error object', () => {
      const error = new Error('Test error');
      logger.error('Test error message', error);

      expect(consoleSpy.error).toHaveBeenCalledWith(
        '[ERROR] Test error message',
        expect.objectContaining({
          error: 'Test error',
          name: 'Error',
        })
      );
    });

    it('should log error messages with context', () => {
      logger.error('Test error message', { key: 'value' }, { additional: 'context' });

      expect(consoleSpy.error).toHaveBeenCalledWith(
        '[ERROR] Test error message',
        { key: 'value', additional: 'context' }
      );
    });
  });

  describe('child', () => {
    it('should create a child logger with additional context', () => {
      const childLogger = logger.child({ parent: 'context' });
      childLogger.warn('Child message', { child: 'data' });

      expect(consoleSpy.warn).toHaveBeenCalledWith(
        '[WARN] Child message',
        { parent: 'context', child: 'data' }
      );
    });
  });
});
