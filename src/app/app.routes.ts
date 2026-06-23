import type { Routes } from "@angular/router";

import { ProductCatalogComponent } from "./product-lookup/product-catalog.component";
import { HealthCheckComponent } from "./health-check.component";
import { HomeComponent } from "./home.component";

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
    path: "**",
    redirectTo: ""
  }
];
