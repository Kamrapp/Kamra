import type { AppConfig } from "../config/app-config.js";

export interface HealthCheckError {
  code?: string;
  message: string;
  name: string;
}

export interface ApiHealthCheck {
  id: "api";
  label: "API";
  message: string;
  status: "ok";
}

export interface DatabaseHealthCheck {
  databaseName: string | null;
  error?: HealthCheckError;
  id: "database";
  label: "Database";
  message: string;
  status: "connection_failed" | "not_configured" | "ok";
}

export type HealthCheck = ApiHealthCheck | DatabaseHealthCheck;

export interface HealthReport {
  checklist: HealthCheck[];
  checks: {
    api: ApiHealthCheck;
    database: DatabaseHealthCheck;
    mongodb: DatabaseHealthCheck;
  };
  stage: "healthcheck";
  status: "degraded" | "ok";
}

export interface HealthResult {
  report: HealthReport;
  statusCode: number;
}

export interface HealthDependencies {
  pingMongo: () => Promise<void>;
  onHealthCheckFailed?: (error: unknown) => void;
}

function redactErrorMessage(message: string): string {
  return message
    .replace(/mongodb(?:\+srv)?:\/\/[^@\s]+@/giu, "mongodb://[redacted]@")
    .replace(/([a-z][a-z0-9+.-]*:\/\/)[^/\s:@]+:[^@\s/]+@/giu, "$1[redacted]@");
}

function getErrorCode(error: unknown): string | undefined {
  if (!error || typeof error !== "object") {
    return undefined;
  }

  const code = (error as { code?: unknown }).code;
  if (typeof code === "string" || typeof code === "number") {
    return String(code);
  }

  return undefined;
}

function toHealthCheckError(error: unknown): HealthCheckError {
  if (error instanceof Error) {
    return {
      code: getErrorCode(error),
      message: redactErrorMessage(error.message),
      name: error.name
    };
  }

  if (typeof error === "string") {
    return {
      message: redactErrorMessage(error),
      name: "Error"
    };
  }

  return {
    message: "Unknown database connection error.",
    name: "Error"
  };
}

async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number
): Promise<T> {
  return await Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    })
  ]);
}

function createHealthReport(
  databaseCheck: DatabaseHealthCheck
): HealthReport {
  const apiCheck: ApiHealthCheck = {
    id: "api",
    label: "API",
    message: "The health route responded.",
    status: "ok"
  };
  const status = databaseCheck.status === "ok" ? "ok" : "degraded";

  return {
    checklist: [apiCheck, databaseCheck],
    checks: {
      api: apiCheck,
      database: databaseCheck,
      mongodb: databaseCheck
    },
    stage: "healthcheck",
    status
  };
}

export async function getHealthResult(
  config: AppConfig,
  dependencies: HealthDependencies
): Promise<HealthResult> {
  if (!config.mongodb.configured) {
    return {
      report: createHealthReport({
        databaseName: config.mongodb.databaseName,
        id: "database",
        label: "Database",
        message: "MongoDB is missing MONGODB_URI or MONGODB_DB_NAME.",
        status: "not_configured"
      }),
      statusCode: 503
    };
  }

  try {
    await withTimeout(dependencies.pingMongo(), 6000);

    return {
      report: createHealthReport({
        databaseName: config.mongodb.databaseName,
        id: "database",
        label: "Database",
        message: "MongoDB ping completed successfully.",
        status: "ok"
      }),
      statusCode: 200
    };
  } catch (error) {
    dependencies.onHealthCheckFailed?.(error);

    return {
      report: createHealthReport({
        databaseName: config.mongodb.databaseName,
        error: toHealthCheckError(error),
        id: "database",
        label: "Database",
        message: "MongoDB ping failed.",
        status: "connection_failed"
      }),
      statusCode: 503
    };
  }
}
