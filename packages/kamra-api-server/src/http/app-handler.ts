import {
  createRouteContext,
  json,
  type AppHandlerDependencies,
  type AppRequest,
  type AppResponse,
  type AppRoute
} from "./app-route-context.js";
import { writeServerLog } from "../logging/kamra-logger.js";
import {
  catalogProductRoute,
  catalogProductsRoute,
  catalogProductValidationRoute,
  catalogSourcesRoute
} from "./routes/catalog-routes.js";
import { currentUserRoute, loginRoute, logoutRoute, userPreferencesRoute } from "./routes/auth-routes.js";
import {
  healthRoute,
  markLegacyProductsUnvalidatedRoute,
  upgradeCatalogValidatorsRoute
} from "./routes/health-route.js";
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

export type { AppRequest, AppResponse } from "./app-route-context.js";

const appRoutes: AppRoute[] = [
  logRoute,
  loginRoute,
  logoutRoute,
  currentUserRoute,
  userPreferencesRoute,
  healthRoute,
  upgradeCatalogValidatorsRoute,
  markLegacyProductsUnvalidatedRoute,
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
  const route = appRoutes.find((candidate) => candidate.match(request));

  if (!route) {
    return json(404, {
      error: "not_found"
    });
  }

  try {
    return await route.handle(request, context);
  } catch (error: unknown) {
    writeServerLog("error", "Unhandled application route failure", {
      error
    });

    return json(500, {
      error: "internal_error",
      message: error instanceof Error && error.message
        ? error.message
        : "Internal server error"
    });
  }
}
