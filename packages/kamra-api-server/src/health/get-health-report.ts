import type { AppConfig } from "../config/app-config.js";

export interface HealthReport {
  checks: {
    api: {
      status: "ok";
    };
    mongodb: {
      databaseName: string | null;
      status: "connection_failed" | "not_configured" | "ok";
    };
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

export async function getHealthResult(
  config: AppConfig,
  dependencies: HealthDependencies
): Promise<HealthResult> {
  if (!config.mongodb.configured) {
    return {
      report: {
        checks: {
          api: { status: "ok" },
          mongodb: {
            databaseName: config.mongodb.databaseName,
            status: "not_configured"
          }
        },
        stage: "healthcheck",
        status: "degraded"
      },
      statusCode: 503
    };
  }

  try {
    await withTimeout(dependencies.pingMongo(), 6000);

    return {
      report: {
        checks: {
          api: { status: "ok" },
          mongodb: {
            databaseName: config.mongodb.databaseName,
            status: "ok"
          }
        },
        stage: "healthcheck",
        status: "ok"
      },
      statusCode: 200
    };
  } catch (error) {
    dependencies.onHealthCheckFailed?.(error);

    return {
      report: {
        checks: {
          api: { status: "ok" },
          mongodb: {
            databaseName: config.mongodb.databaseName,
            status: "connection_failed"
          }
        },
        stage: "healthcheck",
        status: "degraded"
      },
      statusCode: 503
    };
  }
}
