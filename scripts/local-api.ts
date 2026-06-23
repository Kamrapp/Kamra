import { createServer } from "node:http";

import { handleNodeRequest } from "../packages/kamra-api-server/src/http/node-adapter.js";
import { writeServerLog } from "../packages/kamra-api-server/src/logging/kamra-logger.js";

const port = Number(process.env["PORT"] ?? 3000);
const nodeEnv = process.env["NODE_ENV"] ?? "development";

writeServerLog("info", "Local API starting", {
  nodeEnv,
  port
});

const server = createServer(async (request, response) => {
  await handleNodeRequest(request, response);
});

server.listen(port, () => {
  writeServerLog("info", "Local API listening", {
    url: `http://localhost:${port}`
  });
});
