import {
  createRouteContext,
  describeRequest,
  json,
  type AppHandlerDependencies,
  type AppRequest,
  type AppResponse
} from "./app-route-context.js";
import { findAllowedCorsOrigin } from "../config/app-config.js";
import { writeServerLog } from "../logging/kamra-logger.js";
import { accessRoutes } from "./routes/access/index.js";
import { adminRoutes } from "./routes/admin/index.js";
import { catalogRoutes } from "./routes/catalog/index.js";
import { householdRoutes } from "./routes/household/index.js";
import { ingestionRoutes } from "./routes/ingestion/index.js";
import { observabilityRoutes } from "./routes/observability/index.js";

export type { AppRequest, AppResponse } from "./app-route-context.js";

const appRoutes = [
  ...observabilityRoutes,
  ...accessRoutes,
  ...householdRoutes,
  ...adminRoutes,
  ...catalogRoutes,
  ...ingestionRoutes
];

export async function handleAppRequest(
  request: AppRequest,
  dependencies: AppHandlerDependencies = {}
): Promise<AppResponse> {
  const context = createRouteContext(dependencies);

  if (request.method === "OPTIONS" && isApiRequestPath(request.path)) {
    return handleCorsPreflight(request, context.config);
  }

  const route = appRoutes.find((candidate) => candidate.match(request));

  if (!route) {
    return withCorsHeaders(
      request,
      context.config,
      json(404, {
        error: "not_found"
      })
    );
  }

  try {
    return withCorsHeaders(request, context.config, await route.handle(request, context));
  } catch (error: unknown) {
    writeServerLog("error", "Unhandled application route failure", {
      error,
      ...describeRequest(request)
    });

    return withCorsHeaders(
      request,
      context.config,
      json(500, {
        error: "internal_error",
        message: error instanceof Error && error.message ? error.message : "Internal server error"
      })
    );
  }
}

function handleCorsPreflight(
  request: AppRequest,
  config: ReturnType<typeof createRouteContext>["config"]
): AppResponse {
  const allowedOrigin = readAllowedCorsOrigin(request, config);
  if (!allowedOrigin) {
    return {
      body: "",
      headers: {
        "cache-control": "no-store",
        vary: "Origin"
      },
      status: 403
    };
  }

  return {
    body: "",
    headers: {
      "access-control-allow-headers": config.cors.allowedHeaders.join(", "),
      "access-control-allow-methods": config.cors.allowedMethods.join(", "),
      "access-control-allow-origin": allowedOrigin,
      "access-control-max-age": "600",
      "cache-control": "no-store",
      vary: "Origin"
    },
    status: 204
  };
}

function isApiRequestPath(path: string): boolean {
  return path === "/api" || path.startsWith("/api/");
}

function readAllowedCorsOrigin(
  request: AppRequest,
  config: ReturnType<typeof createRouteContext>["config"]
): string | null {
  const origin = getHeaderValue(request.headers, "origin");
  return origin ? findAllowedCorsOrigin(config, origin) : null;
}

function withCorsHeaders(
  request: AppRequest,
  config: ReturnType<typeof createRouteContext>["config"],
  response: AppResponse
): AppResponse {
  const allowedOrigin = readAllowedCorsOrigin(request, config);
  if (!allowedOrigin) {
    return response;
  }

  return {
    ...response,
    headers: {
      ...response.headers,
      "access-control-allow-origin": allowedOrigin,
      vary: mergeVaryHeader(response.headers["vary"], "Origin")
    }
  };
}

function getHeaderValue(headers: AppRequest["headers"], name: string): string | null {
  const normalizedName = name.toLowerCase();

  for (const [headerName, headerValue] of Object.entries(headers)) {
    if (headerName.toLowerCase() !== normalizedName) {
      continue;
    }

    return Array.isArray(headerValue) ? (headerValue[0] ?? null) : (headerValue ?? null);
  }

  return null;
}

function mergeVaryHeader(currentValue: string | undefined, nextValue: string): string {
  if (!currentValue) {
    return nextValue;
  }

  const values = currentValue
    .split(",")
    .map((value) => value.trim())
    .filter((value) => value.length > 0);

  if (values.some((value) => value.toLowerCase() === nextValue.toLowerCase())) {
    return currentValue;
  }

  return `${currentValue}, ${nextValue}`;
}
