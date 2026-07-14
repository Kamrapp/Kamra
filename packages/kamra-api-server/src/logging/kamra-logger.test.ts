import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("node:fs", () => ({
  appendFileSync: vi.fn(),
  existsSync: vi.fn(() => false),
  mkdirSync: vi.fn(),
  readdirSync: vi.fn(() => []),
  rmSync: vi.fn()
}));

import { appendFileSync, mkdirSync } from "node:fs";

import { writeServerLog, writeStructuredServerLog } from "./kamra-logger.js";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe("kamra logger", () => {
  it("does not attempt file logging on Vercel", () => {
    vi.stubEnv("VERCEL", "1");
    vi.stubEnv("LOG_FILE_DIR", "D:/Code/Kamra/logs");

    writeServerLog("info", "hello");

    expect(mkdirSync).not.toHaveBeenCalled();
    expect(appendFileSync).not.toHaveBeenCalled();
  });

  it("writes files when an explicit log directory is configured", () => {
    vi.stubEnv("LOG_FILE_DIR", "D:/Code/Kamra/logs");

    writeServerLog("info", "hello");

    expect(mkdirSync).toHaveBeenCalled();
    expect(appendFileSync).toHaveBeenCalled();
  });

  it("redacts sensitive structured details and bounds long values", () => {
    vi.stubEnv("VERCEL", "1");
    writeStructuredServerLog({
      category: "audit",
      details: { password: "secret", note: "x".repeat(600) },
      eventName: "flag.changed",
      level: "info",
      message: "Feature flag changed"
    });
    expect(appendFileSync).not.toHaveBeenCalled();
  });
});
