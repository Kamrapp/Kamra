import { createServer } from "node:http";

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
});
