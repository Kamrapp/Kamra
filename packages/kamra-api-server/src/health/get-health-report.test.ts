import { describe, expect, it, vi } from "vitest";

import { getHealthResult } from "./get-health-report.js";

describe("getHealthResult", () => {
  it("returns a degraded status when MongoDB is not configured", async () => {
    const result = await getHealthResult(
      {
        mongodb: {
          configured: false,
          databaseName: null,
          dnsServers: null,
          uri: null
        },
        nodeEnv: "test"
      },
      {
        pingMongo: vi.fn()
      }
    );

    expect(result).toEqual({
      report: {
        checks: {
          api: { status: "ok" },
          mongodb: {
            databaseName: null,
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
      {
        mongodb: {
          configured: true,
          databaseName: "kamra",
          dnsServers: null,
          uri: "mongodb://example"
        },
        nodeEnv: "test"
      },
      {
        pingMongo: vi.fn().mockResolvedValue(undefined)
      }
    );

    expect(result).toEqual({
      report: {
        checks: {
          api: { status: "ok" },
          mongodb: {
            databaseName: "kamra",
            status: "ok"
          }
        },
        stage: "healthcheck",
        status: "ok"
      },
      statusCode: 200
    });
  });
});
