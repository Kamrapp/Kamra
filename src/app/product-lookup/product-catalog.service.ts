import { Injectable, inject } from "@angular/core";

import { AuthService } from "../auth.service";

export interface ProductMeasurement {
  normalizedUnit?: string | null;
  normalizedValue?: number | null;
  unit: string;
  value: number;
}

export interface CatalogProductListItem {
  brandName?: string | null;
  householdStockCount: number;
  id: string;
  measurements: ProductMeasurement[];
  name: string;
  primaryCategoryKey?: string | null;
  sourceNames: string[];
  tagKeys: string[];
}

interface CatalogProductsResponse {
  products: CatalogProductListItem[];
}

export type ProductCatalogLoadResult =
  | {
      products: CatalogProductListItem[];
      status: "ok";
    }
  | {
      message: string;
      status: "forbidden" | "not_configured" | "unavailable" | "unauthenticated";
    };

@Injectable({
  providedIn: "root"
})
export class ProductCatalogService {
  private readonly auth = inject(AuthService);

  async listProductsForReview(): Promise<ProductCatalogLoadResult> {
    if (!this.auth.token()) {
      return {
        message: "Sign in before loading products.",
        status: "unauthenticated"
      };
    }

    const response = await fetch("/api/catalog/products", {
      headers: {
        accept: "application/json",
        ...this.auth.getAuthorizationHeaders()
      },
      method: "GET"
    });

    if (response.status === 401) {
      return {
        message: "The current session does not have access to the product catalog.",
        status: "forbidden"
      };
    }

    if (response.status === 503) {
      return {
        message: "The catalog database is not configured for this environment.",
        status: "not_configured"
      };
    }

    if (!response.ok) {
      return {
        message: "The product catalog route returned an error.",
        status: "unavailable"
      };
    }

    const payload = (await response.json()) as CatalogProductsResponse;

    return {
      products: payload.products,
      status: "ok"
    };
  }
}
