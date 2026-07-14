import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { extname, relative, resolve } from "node:path";

import { readAppConfig } from "../packages/kamra-api-server/src/config/app-config.js";
import { getMongoClient } from "../packages/kamra-api-server/src/db/mongo-client.js";
import { handleNodeRequest } from "../packages/kamra-api-server/src/http/node-adapter.js";
import { writeServerLog } from "../packages/kamra-api-server/src/logging/kamra-logger.js";

const host = process.env["HOST"]?.trim() || "0.0.0.0";
const port = Number(process.env["PORT"] ?? 3000);
const staticRoot = resolve(
  process.env["STATIC_ROOT"]?.trim() || resolve(process.cwd(), "dist/kamra-web/browser")
);

const contentTypes: Record<string, string> = {
  ".css": "text/css; charset=utf-8",
  ".gif": "image/gif",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2"
};

const server = createServer((request, response) => {
  void handleRequest(request, response).catch((error: unknown) => {
    writeServerLog("error", "Container request failed", { error });
    if (!response.headersSent) {
      writeTextResponse(response, 500, "Internal server error");
    } else if (!response.writableEnded) {
      response.end();
    }
  });
});

server.listen(port, host, () => {
  writeServerLog("info", "Container application listening", {
    host,
    port,
    staticRoot
  });
  void runStartupDatabaseCheck();
});

async function handleRequest(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const requestUrl = new URL(request.url ?? "/", "http://localhost");
  if (requestUrl.pathname === "/api" || requestUrl.pathname.startsWith("/api/")) {
    await handleNodeRequest(request, response);
    return;
  }

  await serveFrontend(request, response, requestUrl.pathname);
}

async function serveFrontend(
  request: IncomingMessage,
  response: ServerResponse,
  pathname: string
): Promise<void> {
  if (request.method !== "GET" && request.method !== "HEAD") {
    writeTextResponse(response, 405, "Method not allowed", { allow: "GET, HEAD" });
    return;
  }

  let decodedPath: string;
  try {
    decodedPath = decodeURIComponent(pathname);
  } catch {
    writeTextResponse(response, 400, "Invalid request path");
    return;
  }

  const requestedFile = safeStaticPath(decodedPath);
  const filePath = requestedFile && (await isFile(requestedFile)) ? requestedFile : null;
  const hasExtension = extname(decodedPath) !== "";
  const resolvedFilePath = filePath ?? (!hasExtension ? resolve(staticRoot, "index.html") : null);

  if (!resolvedFilePath || !(await isFile(resolvedFilePath))) {
    writeTextResponse(response, 404, "Not found");
    return;
  }

  const fileExtension = extname(resolvedFilePath).toLowerCase();
  response.statusCode = 200;
  response.setHeader("content-type", contentTypes[fileExtension] ?? "application/octet-stream");
  response.setHeader(
    "cache-control",
    resolvedFilePath.endsWith("index.html") ? "no-cache" : "public, max-age=31536000, immutable"
  );

  if (request.method === "HEAD") {
    response.end();
    return;
  }

  createReadStream(resolvedFilePath).pipe(response);
}

function safeStaticPath(pathname: string): string | null {
  const relativePath = pathname.replace(/^\/+/, "");
  const candidate = resolve(staticRoot, relativePath);
  const relativeCandidate = relative(staticRoot, candidate);
  if (relativeCandidate.startsWith("..") || relativeCandidate.includes("..")) {
    return null;
  }
  return candidate;
}

async function isFile(path: string): Promise<boolean> {
  try {
    return (await stat(path)).isFile();
  } catch {
    return false;
  }
}

function writeTextResponse(
  response: ServerResponse,
  status: number,
  body: string,
  headers: Record<string, string> = {}
): void {
  response.statusCode = status;
  response.setHeader("content-type", "text/plain; charset=utf-8");
  for (const [name, value] of Object.entries(headers)) response.setHeader(name, value);
  response.end(body);
}

async function runStartupDatabaseCheck(): Promise<void> {
  const config = readAppConfig();
  if (!config.mongodb.configured || !config.mongodb.uri || !config.mongodb.databaseName) {
    writeServerLog("warn", "Container startup database check skipped", {
      reason: "mongodb_not_configured"
    });
    return;
  }

  try {
    const client = await getMongoClient(config.mongodb.uri, config.mongodb.dnsServers);
    await client.db(config.mongodb.databaseName).command({ ping: 1 });
    writeServerLog("info", "Container startup database check succeeded", {
      databaseName: config.mongodb.databaseName
    });
  } catch (error: unknown) {
    writeServerLog("error", "Container startup database check failed", {
      databaseName: config.mongodb.databaseName,
      error
    });
  }
}
