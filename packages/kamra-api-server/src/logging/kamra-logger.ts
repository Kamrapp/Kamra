import { appendFileSync, existsSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";

export type LogLevel = "debug" | "info" | "warn" | "error";
export type LogScope = "server" | "browser";

export interface LogDetails {
  [key: string]: unknown;
}

export interface LogRecord {
  category?: "application" | "audit" | "diagnostic";
  correlationId?: string;
  details?: LogDetails;
  eventName?: string;
  level: LogLevel;
  message: string;
  scope: LogScope;
  timestamp: string;
}

export interface StructuredLogInput {
  category: "application" | "audit" | "diagnostic";
  correlationId?: string;
  details?: LogDetails;
  eventName: string;
  level: LogLevel;
  message: string;
}

const logRetentionDays = 10;
const cleanedScopes = new Set<LogScope>();
let logFileWriteWarningEmitted = false;

function toIsoDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function getConfiguredLogDirectory(): string | null {
  if (process.env["VERCEL"]) {
    return null;
  }

  const explicitLogDirectory = process.env["LOG_FILE_DIR"]?.trim();
  if (explicitLogDirectory) {
    return explicitLogDirectory;
  }

  return join(process.cwd(), "logs");
}

function getLogFilePath(scope: LogScope, when = new Date()): string {
  const logDirectory = getConfiguredLogDirectory();
  if (!logDirectory) {
    return "";
  }

  return join(logDirectory, `${scope}-${toIsoDate(when)}.log`);
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

  if (!details || typeof details !== "object" || Array.isArray(details)) return details;
  const result: LogDetails = {};
  for (const [key, value] of Object.entries(details)) {
    if (["password", "token", "authorization", "credential", "rawBody"].some((sensitive) => key.toLowerCase().includes(sensitive))) {
      result[key] = "[REDACTED]";
    } else if (typeof value === "string" && value.length > 500) {
      result[key] = `${value.slice(0, 500)}…`;
    } else {
      result[key] = value;
    }
  }
  return result;
}

function purgeExpiredLogs(scope: LogScope, logDirectory: string): void {
  if (cleanedScopes.has(scope)) {
    return;
  }

  cleanedScopes.add(scope);

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
  const logFilePath = getLogFilePath(record.scope);
  if (!logFilePath) {
    return;
  }

  try {
    const logDirectory = dirname(logFilePath);
    purgeExpiredLogs(record.scope, logDirectory);
    mkdirSync(logDirectory, { recursive: true });
    appendFileSync(logFilePath, `${JSON.stringify(record)}\n`, "utf8");
  } catch (error) {
    if (!logFileWriteWarningEmitted) {
      logFileWriteWarningEmitted = true;
      console.warn(
        `${new Date().toISOString()} [kamra:server] File logging disabled`,
        error
      );
    }
  }
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

export function writeStructuredServerLog(input: StructuredLogInput): void {
  const record: LogRecord = {
    category: input.category,
    correlationId: input.correlationId,
    details: normalizeDetails(input.details) as LogDetails | undefined,
    eventName: input.eventName,
    level: input.level,
    message: input.message,
    scope: "server",
    timestamp: new Date().toISOString()
  };
  writeRecord(record);
  logToConsole("server", input.level, input.message, record.details);
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
