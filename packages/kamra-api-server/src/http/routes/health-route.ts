import { getHealthResult } from "../../health/get-health-report.js";
import { writeServerLog } from "../../logging/kamra-logger.js";
import { json, unauthorized, type AppRoute } from "../app-route-context.js";

export const healthRoute: AppRoute = {
  match: (request) => request.method === "GET" && request.path === "/api/health",
  handle: async (request, context) => {
    const user = context.authenticateRequestUser(request);
    if (!user || user.role !== "admin") {
      return unauthorized("Sign in as an admin to view this resource.");
    }

    const config = context.config;
    const result = await getHealthResult(config, {
      onHealthCheckFailed: (error) => {
        writeServerLog("error", "Health check failed", error);
      },
      pingMongo: async () => {
        if (!config.mongodb.uri || !config.mongodb.databaseName) {
          return;
        }

        const client = await context.getMongoClient(
          config.mongodb.uri,
          config.mongodb.dnsServers
        );
        await client.db(config.mongodb.databaseName).command({ ping: 1 });
      }
    });

    writeServerLog("info", "Health check completed", {
      databaseName: result.report.checks.database.databaseName,
      databaseStatus: result.report.checks.database.status,
      requestPath: request.path,
      status: result.report.status,
      statusCode: result.statusCode
    });

    return json(result.statusCode, result.report);
  }
};
