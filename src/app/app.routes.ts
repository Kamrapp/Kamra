import type { Routes } from "@angular/router";

import { ProductCatalogComponent } from "./product-lookup/product-catalog.component";
import { HealthCheckComponent } from "./health-check.component";
import { HomeComponent } from "./home.component";
import { IngestionAdminComponent } from "./site-admin/ingestion-admin.component";

export const routes: Routes = [
  {
    path: "",
    component: HomeComponent
  },
  {
    path: "health",
    component: HealthCheckComponent
  },
  {
    path: "products",
    component: ProductCatalogComponent
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
