import type { IncomingMessage, ServerResponse } from "http";

import { handleNodeRequest } from "../../../../packages/kamra-api-server/src/http/node-adapter.js";

// Vercel Function route for /api/admin/ingestion/review-item/accept.
// Keep this entrypoint thin: it delegates to the shared Kamra API server package.
export default async function acceptProductReviewItem(
  request: IncomingMessage,
  response: ServerResponse
): Promise<void> {
  await handleNodeRequest(request, response);
}
