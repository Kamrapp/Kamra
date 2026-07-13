import type { Routes } from "@angular/router";

import { AboutPageComponent } from "./about/about-page.component";
import { ProductCatalogComponent } from "./product-lookup/product-catalog.component";
import { AdminDashboardComponent } from "./dev-admin/admin-dashboard.component";
import { HouseholdManagementComponent } from "./household/household-management.component";
import { HomeComponent } from "./home.component";
import { IngestionAdminComponent } from "./site-admin/ingestion-admin.component";
import { Stage9AdminComponent } from "./site-admin/stage9-pricing/index";
import { ManualPageComponent } from "./manual/manual-page.component";

export const routes: Routes = [
  {
    path: "",
    component: HomeComponent
  },
  {
    path: "about",
    component: AboutPageComponent
  },
  {
    path: "manual",
    component: ManualPageComponent
  },
  {
    path: "dev-admin",
    component: AdminDashboardComponent
  },
  {
    path: "health",
    redirectTo: "dev-admin"
  },
  {
    path: "product-lookup",
    component: ProductCatalogComponent
  },
  {
    path: "household/:householdId",
    component: HouseholdManagementComponent
  },
  {
    path: "site-admin/ingestion",
    component: IngestionAdminComponent
  },
  {
    path: "site-admin/shopping",
    component: Stage9AdminComponent
  },
  {
    path: "**",
    redirectTo: ""
  }
];
