import { createServer } from "node:http";

import { readAppConfig } from "../packages/kamra-api-server/src/config/app-config.js";
import { getMongoClient } from "../packages/kamra-api-server/src/db/mongo-client.js";
import { handleNodeRequest } from "../packages/kamra-api-server/src/http/node-adapter.js";
import { writeServerLog } from "../packages/kamra-api-server/src/logging/kamra-logger.js";

const host = process.env["HOST"]?.trim() || "0.0.0.0";
const port = Number(process.env["PORT"] ?? 3000);
const nodeEnv = process.env["NODE_ENV"] ?? "development";

writeServerLog("info", "API server starting", {
  host,
  nodeEnv,
  port
});

const server = createServer((request, response) => {
  void handleNodeRequest(request, response).catch((error: unknown) => {
    writeServerLog("error", "Local API request failed", {
      error
    });

    if (!response.headersSent) {
      response.statusCode = 500;
      response.setHeader("content-type", "application/json; charset=utf-8");
      response.end(JSON.stringify({
        error: "internal_error",
        message: error instanceof Error && error.message
          ? error.message
          : "Internal server error"
      }));
      return;
    }

    if (!response.writableEnded) {
      response.end();
    }
  });
});

server.listen(port, host, () => {
  writeServerLog("info", "API server listening", {
    host,
    url: `http://localhost:${port}`
  });

  void runStartupDatabaseCheck();
});

async function runStartupDatabaseCheck(): Promise<void> {
  const config = readAppConfig();
  if (!config.mongodb.configured || !config.mongodb.uri || !config.mongodb.databaseName) {
    writeServerLog("info", "Startup database connection check skipped", {
      reason: "mongodb_not_configured"
    });
    return;
  }

  try {
    const client = await getMongoClient(
      config.mongodb.uri,
      config.mongodb.dnsServers
    );
    await client.db(config.mongodb.databaseName).command({ ping: 1 });

    writeServerLog("info", "Startup database connection check succeeded", {
      databaseName: config.mongodb.databaseName
    });
  } catch (error: unknown) {
    writeServerLog("error", "Startup database connection check failed", {
      databaseName: config.mongodb.databaseName,
      error
    });
  }
}
