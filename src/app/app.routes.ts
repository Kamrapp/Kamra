import type { Routes } from "@angular/router";

import { ProductCatalogComponent } from "./product-lookup/product-catalog.component";
import { HealthCheckComponent } from "./health-check.component";
import { HomeComponent } from "./home.component";
import { IngestionAdminComponent } from "./site-admin/ingestion-admin.component";

export const routes: Routes = [
  {
    path: "",
    component: HomeComponent,
    title: "Kamra"
  },
  {
    path: "health",
    component: HealthCheckComponent,
    title: "Kamra Health Check"
  },
  {
    path: "products",
    component: ProductCatalogComponent,
    title: "Kamra Products"
  },
  {
    path: "admin/ingestion",
    component: IngestionAdminComponent,
    title: "Kamra Crawls"
  },
  {
    path: "**",
    redirectTo: ""
  }
];
