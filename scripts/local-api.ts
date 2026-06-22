import { createServer } from "node:http";

import { handleNodeRequest } from "../packages/api-core/src/http/node-adapter.js";

const port = Number(process.env["PORT"] ?? 3000);

const server = createServer(async (request, response) => {
  await handleNodeRequest(request, response);
});

server.listen(port, () => {
  console.log(`Kamra local API listening on http://localhost:${port}`);
});
