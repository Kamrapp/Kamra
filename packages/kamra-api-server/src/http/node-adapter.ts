import type { IncomingMessage, ServerResponse } from "node:http";

import { handleAppRequest, type AppResponse } from "./app-handler.js";

function writeResponse(response: ServerResponse, appResponse: AppResponse): void {
  response.statusCode = appResponse.status;

  for (const [headerName, headerValue] of Object.entries(appResponse.headers)) {
    response.setHeader(headerName, headerValue);
  }

  response.end(appResponse.body);
}

function toAppUrl(urlValue: string | undefined): URL {
  return new URL(urlValue ?? "/", "http://localhost");
}

function toAppQuery(searchParams: URLSearchParams): Record<string, string | string[] | undefined> {
  const query: Record<string, string | string[] | undefined> = {};

  for (const [key, value] of searchParams.entries()) {
    const currentValue = query[key];
    if (Array.isArray(currentValue)) {
      currentValue.push(value);
    } else if (typeof currentValue === "string") {
      query[key] = [currentValue, value];
    } else {
      query[key] = value;
    }
  }

  return query;
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
  const appUrl = toAppUrl(request.url);
  const appResponse = await handleAppRequest({
    bodyText: await readRequestBody(request),
    headers: request.headers,
    method: request.method ?? "GET",
    path: appUrl.pathname,
    query: toAppQuery(appUrl.searchParams)
  });

  writeResponse(response, appResponse);
}
