import type { IncomingMessage, ServerResponse } from "node:http";

import { handleAppRequest, type AppResponse } from "./app-handler.js";

function writeResponse(response: ServerResponse, appResponse: AppResponse): void {
  response.statusCode = appResponse.status;

  for (const [headerName, headerValue] of Object.entries(appResponse.headers)) {
    response.setHeader(headerName, headerValue);
  }

  response.end(appResponse.body);
}

function toAppPath(urlValue: string | undefined): string {
  return new URL(urlValue ?? "/", "http://localhost").pathname;
}

async function readRequestBody(request: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];

  for await (const chunk of request) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }

  return Buffer.concat(chunks).toString("utf8");
}

export async function handleNodeRequest(
  request: IncomingMessage,
  response: ServerResponse
): Promise<void> {
  const appResponse = await handleAppRequest({
    headers: request.headers,
    method: request.method ?? "GET",
    path: toAppPath(request.url),
    bodyText: await readRequestBody(request)
  });

  writeResponse(response, appResponse);
}
