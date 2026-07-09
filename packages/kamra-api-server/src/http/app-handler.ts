import {
  createRouteContext,
  json,
  type AppHandlerDependencies,
  type AppRequest,
  type AppResponse,
  type AppRoute
} from "./app-route-context.js";
import { findAllowedCorsOrigin } from "../config/app-config.js";
import { writeServerLog } from "../logging/kamra-logger.js";
import {
  catalogProductRoute,
  catalogProductsRoute,
  catalogProductValidationRoute,
  catalogSourcesRoute
} from "./routes/catalog-routes.js";
import { currentUserRoute, loginRoute, logoutRoute, userPreferencesRoute } from "./routes/auth-routes.js";
import {
  adminDashboardHealthRoute,
  adminDashboardMarkLegacyProductsUnvalidatedRoute,
  adminDashboardReseedDemoHouseholdRoute,
  adminDashboardUpgradeCatalogValidatorsRoute
} from "./routes/admin-dashboard-route.js";
import { householdStockRoute, householdsRoute } from "./routes/household-routes.js";
import {
  acceptProductReviewItemRoute,
  declineProductReviewItemRoute,
  ingestionSnapshotsRoute,
  prepareProductReviewItemsRoute,
  previewProductReviewItemAcceptanceRoute,
  processIngestionSnapshotRoute,
  productReviewItemRoute,
  productReviewItemsRoute
} from "./routes/ingestion-routes.js";
import { logRoute } from "./routes/log-route.js";
import { healthzRoute } from "./routes/health-route.js";

export type { AppRequest, AppResponse } from "./app-route-context.js";

const appRoutes: AppRoute[] = [
  healthzRoute,
  logRoute,
  loginRoute,
  logoutRoute,
  currentUserRoute,
  userPreferencesRoute,
  householdsRoute,
  householdStockRoute,
  adminDashboardHealthRoute,
  adminDashboardUpgradeCatalogValidatorsRoute,
  adminDashboardMarkLegacyProductsUnvalidatedRoute,
  adminDashboardReseedDemoHouseholdRoute,
  catalogProductRoute,
  catalogProductValidationRoute,
  catalogProductsRoute,
  catalogSourcesRoute,
  ingestionSnapshotsRoute,
  processIngestionSnapshotRoute,
  prepareProductReviewItemsRoute,
  previewProductReviewItemAcceptanceRoute,
  productReviewItemsRoute,
  productReviewItemRoute,
  acceptProductReviewItemRoute,
  declineProductReviewItemRoute
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
    return withCorsHeaders(request, context.config, json(404, {
      error: "not_found"
    }));
  }

  try {
    return withCorsHeaders(request, context.config, await route.handle(request, context));
  } catch (error: unknown) {
    writeServerLog("error", "Unhandled application route failure", {
      error
    });

    return withCorsHeaders(request, context.config, json(500, {
      error: "internal_error",
      message: error instanceof Error && error.message
        ? error.message
        : "Internal server error"
    }));
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
  return origin
    ? findAllowedCorsOrigin(config, origin)
    : null;
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

function getHeaderValue(
  headers: AppRequest["headers"],
  name: string
): string | null {
  const normalizedName = name.toLowerCase();

  for (const [headerName, headerValue] of Object.entries(headers)) {
    if (headerName.toLowerCase() !== normalizedName) {
      continue;
    }

    return Array.isArray(headerValue)
      ? headerValue[0] ?? null
      : headerValue ?? null;
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
