import type { AppRoute } from "../../app-route-context.js";
import {
  catalogProductRoute,
  catalogProductsRoute,
  catalogProductValidationRoute,
  catalogSourcesRoute
} from "../catalog-routes.js";

export const catalogRoutes: AppRoute[] = [
  catalogProductRoute,
  catalogProductValidationRoute,
  catalogProductsRoute,
  catalogSourcesRoute
];
