import { Injectable, inject } from "@angular/core";

import { AuthService } from "../auth.service";
import { readApiErrorMessage } from "../shared/api-errors";
import { ToastService } from "../shared/toast.service";

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
  validationStatus: "unvalidated" | "validated" | "invalid";
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

interface CatalogProductResponse {
  product: CatalogProductListItem;
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

type ProductCatalogWriteError = {
  message: string;
  status: "forbidden" | "not_configured" | "unavailable" | "unauthenticated";
};

export type ProductCatalogWriteResult =
  | {
      product: CatalogProductListItem;
      status: "ok";
    }
  | ProductCatalogWriteError;

export type ProductCatalogDeleteResult =
  | {
      status: "ok";
    }
  | ProductCatalogWriteError;

@Injectable({
  providedIn: "root"
})
export class ProductCatalogService {
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);

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
      return this.withToast({
        message: "The current session does not have access to catalog sources.",
        status: "forbidden"
      });
    }

    if (response.status === 503) {
      return this.withToast({
        message: "The catalog database is not configured for this environment.",
        status: "not_configured"
      });
    }

    if (!response.ok) {
      const message = await readApiErrorMessage(response, "The catalog sources route returned an error.");
      return {
        message: this.toastMessage(message),
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
    sourceNames: readonly string[],
    nameIncludes: string | null
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
    if (nameIncludes?.trim()) {
      searchParams.set("nameIncludes", nameIncludes.trim());
    }
    const response = await fetch(`/api/catalog/products?${searchParams.toString()}`, {
      headers: {
        accept: "application/json",
        ...this.auth.getAuthorizationHeaders()
      },
      method: "GET"
    });

    if (response.status === 401) {
      return this.withToast({
        message: "The current session does not have access to the product catalog.",
        status: "forbidden"
      });
    }

    if (response.status === 503) {
      return this.withToast({
        message: "The catalog database is not configured for this environment.",
        status: "not_configured"
      });
    }

    if (!response.ok) {
      const message = await readApiErrorMessage(response, "The product catalog route returned an error.");
      return {
        message: this.toastMessage(message),
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

  async updateProduct(product: CatalogProductListItem): Promise<ProductCatalogWriteResult> {
    return await this.writeProduct("/api/catalog/product", "PATCH", {
      brandName: product.brandName ?? null,
      id: product.id,
      measurements: product.measurements,
      name: product.name,
      primaryCategoryKey: product.primaryCategoryKey ?? null
    });
  }

  async validateProduct(id: string, note: string | null): Promise<ProductCatalogWriteResult> {
    return await this.writeProduct("/api/catalog/product/validate", "POST", { id, note });
  }

  async invalidateProduct(id: string, note: string | null): Promise<ProductCatalogWriteResult> {
    return await this.writeProduct("/api/catalog/product/invalidate", "POST", { id, note });
  }

  async deleteProduct(id: string): Promise<ProductCatalogDeleteResult> {
    if (!this.auth.token()) {
      return {
        message: "Sign in before deleting products.",
        status: "unauthenticated"
      };
    }

    const response = await fetch(`/api/catalog/product?id=${encodeURIComponent(id)}`, {
      headers: {
        accept: "application/json",
        ...this.auth.getAuthorizationHeaders()
      },
      method: "DELETE"
    });

    const error = await readCatalogWriteError(response);
    if (error) {
      return this.withToast(error);
    }

    return { status: "ok" };
  }

  private async writeProduct(
    url: string,
    method: "PATCH" | "POST",
    body: unknown
  ): Promise<ProductCatalogWriteResult> {
    if (!this.auth.token()) {
      return {
        message: "Sign in before editing products.",
        status: "unauthenticated"
      };
    }

    const response = await fetch(url, {
      body: JSON.stringify(body),
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        ...this.auth.getAuthorizationHeaders()
      },
      method
    });

    const error = await readCatalogWriteError(response);
    if (error) {
      return this.withToast(error);
    }

    const payload = (await response.json()) as CatalogProductResponse;

    return {
      product: payload.product,
      status: "ok"
    };
  }

  private toastMessage(message: string): string {
    this.toast.push(message, "error");
    return message;
  }

  private withToast<T extends ProductCatalogWriteError>(error: T): T {
    this.toast.push(error.message, "error");
    return error;
  }
}

async function readCatalogWriteError(response: Response): Promise<ProductCatalogWriteError | null> {
  if (response.status === 401) {
    return {
      message: "The current session does not have access to edit the product catalog.",
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
    const message = await readApiErrorMessage(response, "The product catalog edit route returned an error.");
    return {
      message,
      status: "unavailable"
    };
  }

  return null;
}
