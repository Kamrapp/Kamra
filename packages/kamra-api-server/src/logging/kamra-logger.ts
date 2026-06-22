import { appendFileSync, existsSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";

export type LogLevel = "debug" | "info" | "warn" | "error";
export type LogScope = "server" | "browser";

export interface LogDetails {
  [key: string]: unknown;
}

export interface LogRecord {
  details?: LogDetails;
  level: LogLevel;
  message: string;
  scope: LogScope;
  timestamp: string;
}

const logRetentionDays = 10;
const cleanedScopes = new Set<LogScope>();

function toIsoDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function getLogDirectory(): string {
  return join(process.cwd(), "logs");
}

function getLogFilePath(scope: LogScope, when = new Date()): string {
  return join(getLogDirectory(), `${scope}-${toIsoDate(when)}.log`);
}

function normalizeDetails(details: unknown): unknown {
  if (details instanceof Error) {
    return {
      cause: details.cause,
      message: details.message,
      name: details.name,
      stack: details.stack
    };
  }

  return details;
}

function purgeExpiredLogs(scope: LogScope): void {
  if (cleanedScopes.has(scope)) {
    return;
  }

  cleanedScopes.add(scope);

  const logDirectory = getLogDirectory();
  if (!existsSync(logDirectory)) {
    return;
  }

  const cutoffTime = Date.now() - logRetentionDays * 24 * 60 * 60 * 1000;
  const filePrefix = `${scope}-`;
  const fileSuffix = ".log";

  for (const entry of readdirSync(logDirectory, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.startsWith(filePrefix) || !entry.name.endsWith(fileSuffix)) {
      continue;
    }

    const dateText = entry.name.slice(filePrefix.length, -fileSuffix.length);
    const parsedDate = new Date(`${dateText}T00:00:00.000Z`);

    if (Number.isNaN(parsedDate.getTime()) || parsedDate.getTime() >= cutoffTime) {
      continue;
    }

    rmSync(join(logDirectory, entry.name), { force: true });
  }
}

function writeRecord(record: LogRecord): void {
  purgeExpiredLogs(record.scope);

  const filePath = getLogFilePath(record.scope);
  mkdirSync(dirname(filePath), { recursive: true });
  appendFileSync(filePath, `${JSON.stringify(record)}\n`, "utf8");
}

function logToConsole(
  scope: LogScope,
  level: LogLevel,
  message: string,
  details?: unknown
): void {
  const prefix = `${new Date().toISOString()} [kamra:${scope}] ${message}`;

  if (level === "error") {
    console.error(prefix, details ?? "");
    return;
  }

  if (level === "warn") {
    console.warn(prefix, details ?? "");
    return;
  }

  console.log(prefix, details ?? "");
}

export function writeServerLog(
  level: LogLevel,
  message: string,
  details?: unknown
): void {
  const record: LogRecord = {
    details: normalizeDetails(details) as LogDetails | undefined,
    level,
    message,
    scope: "server",
    timestamp: new Date().toISOString()
  };

  writeRecord(record);
  logToConsole("server", level, message, details);
}

export function writeBrowserLog(
  level: LogLevel,
  message: string,
  details?: unknown
): void {
  const record: LogRecord = {
    details: normalizeDetails(details) as LogDetails | undefined,
    level,
    message,
    scope: "browser",
    timestamp: new Date().toISOString()
  };

  writeRecord(record);
  logToConsole("browser", level, message, details);
}
