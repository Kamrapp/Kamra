import type { AppRoute } from "../../app-route-context.js";
import {
  adminDashboardFeatureFlagsRoute,
  adminDashboardHealthRoute,
  adminDashboardMarkLegacyProductsUnvalidatedRoute,
  adminDashboardReseedDemoHouseholdRoute,
  adminDashboardUpgradeCatalogValidatorsRoute
} from "../admin-dashboard-route.js";
import {
  databaseMaintenanceCompleteRoute,
  databaseMaintenanceListRoute,
  databaseMaintenanceMigrationRoute,
  databaseMaintenanceRunAllRoute,
  databaseMaintenanceValidatorRoute
} from "../database-maintenance-route.js";
import {
  adminIngestionSubmissionsRoute,
  adminPriceObservationsRoute,
  adminShopMarketsRoute,
  adminShopProductsRoute
} from "../stage9-admin-routes.js";

export const adminRoutes: AppRoute[] = [
  adminShopMarketsRoute,
  adminIngestionSubmissionsRoute,
  adminShopProductsRoute,
  adminPriceObservationsRoute,
  adminDashboardFeatureFlagsRoute,
  adminDashboardHealthRoute,
  adminDashboardUpgradeCatalogValidatorsRoute,
  adminDashboardMarkLegacyProductsUnvalidatedRoute,
  adminDashboardReseedDemoHouseholdRoute,
  databaseMaintenanceListRoute,
  databaseMaintenanceValidatorRoute,
  databaseMaintenanceMigrationRoute,
  databaseMaintenanceCompleteRoute,
  databaseMaintenanceRunAllRoute
];
