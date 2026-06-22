import type { IncomingMessage, ServerResponse } from "node:http";

import { handleNodeRequest } from "../packages/kamra-api-server/src/http/node-adapter.js";

// Vercel Function route for /api/health.
// Keep this entrypoint thin: it delegates to the shared Kamra API server package.
// Local development uses scripts/local-api.ts, which calls the same shared handler.
export default async function health(
  request: IncomingMessage,
  response: ServerResponse
): Promise<void> {
  await handleNodeRequest(request, response);
}
