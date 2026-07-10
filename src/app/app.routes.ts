import type { Routes } from "@angular/router";

import { ProductCatalogComponent } from "./product-lookup/product-catalog.component";
import { AdminDashboardComponent } from "./dev-admin/admin-dashboard.component";
import { HouseholdManagementComponent } from "./household/household-management.component";
import { HomeComponent } from "./home.component";
import { IngestionAdminComponent } from "./site-admin/ingestion-admin.component";

export const routes: Routes = [
  {
    path: "",
    component: HomeComponent
  },
  {
    path: "admin/dashboard",
    component: AdminDashboardComponent
  },
  {
    path: "health",
    redirectTo: "admin/dashboard"
  },
  {
    path: "products",
    component: ProductCatalogComponent
  },
  {
    path: "households/:householdId",
    component: HouseholdManagementComponent
  },
  {
    path: "admin/ingestion",
    component: IngestionAdminComponent
  },
  {
    path: "**",
    redirectTo: ""
  }
];
