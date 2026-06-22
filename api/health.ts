import type { IncomingMessage, ServerResponse } from "node:http";

import { handleNodeRequest } from "../packages/api-core/src/http/node-adapter.js";

export default async function health(
  request: IncomingMessage,
  response: ServerResponse
): Promise<void> {
  await handleNodeRequest(request, response);
}
