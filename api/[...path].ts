import type { IncomingMessage, ServerResponse } from "http";

import { handleNodeRequest } from "../packages/kamra-api-server/src/http/node-adapter.js";

// Vercel catch-all Function for shared API routes without dedicated wrappers.
// The adapter preserves the original URL so the shared dispatcher can select the route.
export default async function sharedApiRoute(
  request: IncomingMessage,
  response: ServerResponse
): Promise<void> {
  await handleNodeRequest(request, response);
}
