import {
  createRouteContext,
  json,
  type AppHandlerDependencies,
  type AppRequest,
  type AppResponse,
  type AppRoute
} from "./app-route-context.js";
import { catalogProductsRoute } from "./routes/catalog-routes.js";
import { currentUserRoute, loginRoute, logoutRoute } from "./routes/auth-routes.js";
import { healthRoute } from "./routes/health-route.js";
import { ingestionSnapshotsRoute, processIngestionSnapshotRoute } from "./routes/ingestion-routes.js";
import { logRoute } from "./routes/log-route.js";

export type { AppRequest, AppResponse } from "./app-route-context.js";

const appRoutes: AppRoute[] = [
  logRoute,
  loginRoute,
  logoutRoute,
  currentUserRoute,
  healthRoute,
  catalogProductsRoute,
  ingestionSnapshotsRoute,
  processIngestionSnapshotRoute
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

  return await route.handle(request, context);
}
