import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { logger, Logger } from "./logger";

describe("Logger", () => {
  let consoleSpy: {
    debug: ReturnType<typeof vi.spyOn>;
    info: ReturnType<typeof vi.spyOn>;
    warn: ReturnType<typeof vi.spyOn>;
    error: ReturnType<typeof vi.spyOn>;
  };

  beforeEach(() => {
    consoleSpy = {
      debug: vi.spyOn(console, "debug").mockImplementation(() => { }),
      info: vi.spyOn(console, "info").mockImplementation(() => { }),
      warn: vi.spyOn(console, "warn").mockImplementation(() => { }),
      error: vi.spyOn(console, "error").mockImplementation(() => { }),
    };
  });

  afterEach(() => {
    Object.values(consoleSpy).forEach((spy) => spy.mockRestore());
  });

  describe("debug", () => {
    it("should log debug messages in development", () => {
      // Mock development environment
      const originalEnv = process.env["NODE_ENV"];
      process.env["NODE_ENV"] = "development";

      logger.debug("Test debug message", { key: "value" });

      expect(consoleSpy.debug).toHaveBeenCalledWith("[DEBUG] Test debug message", { key: "value" });

      process.env["NODE_ENV"] = originalEnv;
    });
  });

  describe("info", () => {
    it("should log info messages in development", () => {
      // Mock development environment
      const originalEnv = process.env["NODE_ENV"];
      process.env["NODE_ENV"] = "development";

      logger.info("Test info message", { key: "value" });

      expect(consoleSpy.info).toHaveBeenCalledWith("[INFO] Test info message", { key: "value" });

      process.env["NODE_ENV"] = originalEnv;
    });
  });

  describe("warn", () => {
    it("should log warn messages", () => {
      logger.warn("Test warn message", { key: "value" });

      expect(consoleSpy.warn).toHaveBeenCalledWith("[WARN] Test warn message", { key: "value" });
    });
  });

  describe("error", () => {
    it("should log error messages with Error object", () => {
      const error = new Error("Test error");
      logger.error("Test error message", error);

      expect(consoleSpy.error).toHaveBeenCalledWith(
        "[ERROR] Test error message",
        expect.objectContaining({
          error: "Test error",
          name: "Error",
        })
      );
    });

    it("should log error messages with context", () => {
      logger.error("Test error message", { key: "value" }, { additional: "context" });

      expect(consoleSpy.error).toHaveBeenCalledWith("[ERROR] Test error message", {
        key: "value",
        additional: "context",
      });
    });
  });

  describe("child", () => {
    it("should create a child logger with additional context", () => {
      const childLogger = logger.child({ parent: "context" });
      childLogger.warn("Child message", { child: "data" });

      expect(consoleSpy.warn).toHaveBeenCalledWith("[WARN] Child message", {
        parent: "context",
        child: "data",
      });
    });

    it("should create a child logger that merges context", () => {
      const childLogger = logger.child({ module: "test" });
      childLogger.error("Error message", new Error("test"), { errorCode: "E001" });

      expect(consoleSpy.error).toHaveBeenCalledWith(
        "[ERROR] Error message",
        expect.objectContaining({
          module: "test",
          errorCode: "E001",
        })
      );
    });

    it("should create a child logger with debug method", () => {
      const originalEnv = process.env["NODE_ENV"];
      process.env["NODE_ENV"] = "development";

      const childLogger = logger.child({ module: "test" });
      childLogger.debug("Debug message", { debugData: "value" });

      expect(consoleSpy.debug).toHaveBeenCalledWith("[DEBUG] Debug message", {
        module: "test",
        debugData: "value",
      });

      process.env["NODE_ENV"] = originalEnv;
    });
  });
});
