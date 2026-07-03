import { Injectable, inject } from "@angular/core";

import { AuthService } from "../auth.service";

export interface ProductMeasurement {
  normalizedUnit?: string | null;
  normalizedValue?: number | null;
  unit: string;
  value: number;
}

export interface CatalogProductOfferPrice {
  amount: number;
  currencyCode: string;
  observedAt: string;
  programName?: string | null;
  unitPriceLabel?: string | null;
  validFrom?: string | null;
  validTo?: string | null;
}

export interface CatalogProductOfferListItem {
  currentCategoryLabel?: string | null;
  identifiers: {
    kind: "gtin" | "national_code" | "retailer_item_number" | "retailer_product_id" | "unknown";
    value: string;
  }[];
  latestObservedAt?: string | null;
  locationKey?: string | null;
  locationLabel?: string | null;
  prices: Partial<Record<"base" | "coupon" | "loyalty_card" | "offer" | "old", CatalogProductOfferPrice>>;
  productSourceId: string;
  sourceName: string;
  sourceProductKey: string;
  sourceProductName: string;
  storeBrandKey: string;
}

export interface CatalogProductListItem {
  brandName?: string | null;
  householdStockCount: number;
  id: string;
  measurements: ProductMeasurement[];
  name: string;
  offers: CatalogProductOfferListItem[];
  primaryCategoryKey?: string | null;
  sourceNames: string[];
  tagKeys: string[];
}

export interface CatalogProductPagination {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

interface CatalogProductsResponse {
  pagination: CatalogProductPagination;
  products: CatalogProductListItem[];
}

interface CatalogSourcesResponse {
  sourceNames: string[];
}

export type ProductCatalogLoadResult =
  | {
      pagination: CatalogProductPagination;
      products: CatalogProductListItem[];
      status: "ok";
    }
  | {
      message: string;
      status: "forbidden" | "not_configured" | "unavailable" | "unauthenticated";
    };

export type ProductCatalogSourcesLoadResult =
  | {
      sourceNames: string[];
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

  async listOfferSourceNames(): Promise<ProductCatalogSourcesLoadResult> {
    if (!this.auth.token()) {
      return {
        message: "Sign in before loading offer sources.",
        status: "unauthenticated"
      };
    }

    const response = await fetch("/api/catalog/sources", {
      headers: {
        accept: "application/json",
        ...this.auth.getAuthorizationHeaders()
      },
      method: "GET"
    });

    if (response.status === 401) {
      return {
        message: "The current session does not have access to catalog sources.",
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
        message: "The catalog sources route returned an error.",
        status: "unavailable"
      };
    }

    const payload = (await response.json()) as CatalogSourcesResponse;

    return {
      sourceNames: payload.sourceNames,
      status: "ok"
    };
  }

  async listProductsForReview(
    page: number,
    pageSize: number,
    sourceNames: readonly string[]
  ): Promise<ProductCatalogLoadResult> {
    if (!this.auth.token()) {
      return {
        message: "Sign in before loading products.",
        status: "unauthenticated"
      };
    }

    const searchParams = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize)
    });
    for (const sourceName of sourceNames) {
      searchParams.append("source", sourceName);
    }
    const response = await fetch(`/api/catalog/products?${searchParams.toString()}`, {
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
      pagination: payload.pagination,
      products: payload.products,
      status: "ok"
    };
  }
}
