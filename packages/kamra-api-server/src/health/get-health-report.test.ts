import { describe, expect, it, vi } from "vitest";

import type { AppConfig } from "../config/app-config.js";
import { getHealthResult } from "./get-health-report.js";

function createConfig(mongodb: AppConfig["mongodb"]): AppConfig {
  return {
    auth: {
      tokenMaxAgeSeconds: 28800,
      tokenSecret: "test-secret",
      tokenSecretConfigured: true
    },
    cors: {
      allowedHeaders: ["Accept", "Authorization", "Content-Type"],
      allowedMethods: ["DELETE", "GET", "OPTIONS", "PATCH", "POST"],
      allowedOriginPatterns: [],
      allowedOrigins: []
    },
    mongodb,
    nodeEnv: "test"
  };
}

describe("getHealthResult", () => {
  it("returns a degraded status when MongoDB is not configured", async () => {
    const result = await getHealthResult(
      createConfig({
        configured: false,
        databaseName: null,
        dnsServers: null,
        uri: null
      }),
      {
        pingMongo: vi.fn()
      }
    );

    expect(result).toEqual({
      report: {
        checklist: [
          {
            id: "api",
            label: "API",
            message: "The health route responded.",
            status: "ok"
          },
          {
            databaseName: null,
            id: "database",
            label: "Database",
            message: "Database connection is missing MONGODB_URI or MONGODB_DB_NAME.",
            status: "not_configured"
          }
        ],
        checks: {
          api: {
            id: "api",
            label: "API",
            message: "The health route responded.",
            status: "ok"
          },
          database: {
            databaseName: null,
            id: "database",
            label: "Database",
            message: "Database connection is missing MONGODB_URI or MONGODB_DB_NAME.",
            status: "not_configured"
          }
        },
        stage: "healthcheck",
        status: "degraded"
      },
      statusCode: 503
    });
  });

  it("returns ok when MongoDB ping succeeds", async () => {
    const result = await getHealthResult(
      createConfig({
        configured: true,
        databaseName: "kamra",
        dnsServers: null,
        uri: "mongodb://example"
      }),
      {
        pingMongo: vi.fn().mockResolvedValue(undefined)
      }
    );

    expect(result).toEqual({
      report: {
        checklist: [
          {
            id: "api",
            label: "API",
            message: "The health route responded.",
            status: "ok"
          },
          {
            databaseName: "kamra",
            id: "database",
            label: "Database",
            message: "Database ping completed successfully.",
            status: "ok"
          }
        ],
        checks: {
          api: {
            id: "api",
            label: "API",
            message: "The health route responded.",
            status: "ok"
          },
          database: {
            databaseName: "kamra",
            id: "database",
            label: "Database",
            message: "Database ping completed successfully.",
            status: "ok"
          }
        },
        stage: "healthcheck",
        status: "ok"
      },
      statusCode: 200
    });
  });

  it("returns sanitized database error details when MongoDB ping fails", async () => {
    const error = new Error(
      "Failed to connect to mongodb+srv://user:super-secret@example.mongodb.net/kamra"
    );
    error.name = "MongoServerSelectionError";

    const result = await getHealthResult(
      createConfig({
        configured: true,
        databaseName: "kamra",
        dnsServers: null,
        uri: "mongodb://example"
      }),
      {
        pingMongo: vi.fn().mockRejectedValue(error)
      }
    );

    expect(result.report.status).toBe("degraded");
    expect(result.statusCode).toBe(503);
    expect(result.report.checklist).toEqual([
      {
        id: "api",
        label: "API",
        message: "The health route responded.",
        status: "ok"
      },
      {
        databaseName: "kamra",
        error: {
          message: "Failed to connect to mongodb://[redacted]@example.mongodb.net/kamra",
          name: "MongoServerSelectionError"
        },
        id: "database",
        label: "Database",
        message: "Database ping failed.",
        status: "connection_failed"
      }
    ]);
    expect(result.report.checks.database.error?.message).not.toContain("super-secret");
  });
});
