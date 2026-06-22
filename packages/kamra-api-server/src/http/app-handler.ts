import { readAppConfig } from "../config/app-config.js";
import { getMongoClient } from "../db/mongo-client.js";
import { getHealthResult } from "../health/get-health-report.js";
import { writeBrowserLog, writeServerLog } from "../logging/kamra-logger.js";

export interface AppRequest {
  headers: Record<string, string | string[] | undefined>;
  method: string;
  path: string;
  bodyText?: string;
}

export interface AppResponse {
  body: string;
  headers: Record<string, string>;
  status: number;
}

function json(status: number, payload: unknown): AppResponse {
  return {
    body: JSON.stringify(payload),
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store"
    },
    status
  };
}

export async function handleAppRequest(request: AppRequest): Promise<AppResponse> {
  if (request.method === "POST" && request.path === "/api/log") {
    try {
      const payload = JSON.parse(request.bodyText ?? "{}") as {
        details?: unknown;
        level?: "debug" | "info" | "warn" | "error";
        message?: string;
      };

      if (typeof payload.message !== "string" || typeof payload.level !== "string") {
        return json(400, { error: "invalid_log_payload" });
      }

      writeBrowserLog(payload.level, payload.message, payload.details);

      return {
        body: "",
        headers: {
          "cache-control": "no-store"
        },
        status: 204
      };
    } catch {
      return json(400, { error: "invalid_log_payload" });
    }
  }

  if (request.method === "GET" && request.path === "/api/health") {
    const config = readAppConfig();
    const result = await getHealthResult(config, {
      onHealthCheckFailed: (error) => {
        if (config.nodeEnv !== "production") {
          writeServerLog("error", "Health check failed", error);
        }
      },
      pingMongo: async () => {
        if (!config.mongodb.uri || !config.mongodb.databaseName) {
          return;
        }

        const client = await getMongoClient(
          config.mongodb.uri,
          config.mongodb.dnsServers
        );
        await client.db(config.mongodb.databaseName).command({ ping: 1 });
      }
    });

    return json(result.statusCode, result.report);
  }

  return json(404, {
    error: "not_found"
  });
}
