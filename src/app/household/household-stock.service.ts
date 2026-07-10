import { Injectable, inject } from "@angular/core";

import { buildApiUrl } from "../api-url";
import { AuthService } from "../auth.service";
import { readApiErrorMessage } from "../shared/api-errors";
import { LocalizationService } from "../shared/localization.service";
import { ToastService } from "../shared/toast.service";

export interface HouseholdListItem {
  createdAt: string;
  id: string;
  memberCount: number;
  membershipRole: "member" | "owner";
  name: string;
  status: "active" | "archived";
  updatedAt: string;
}

export interface HouseholdLocalProductListItem {
  catalogProductId?: string | null;
  catalogProductNameSnapshot?: string | null;
  createdAt: string;
  displayName: string;
  gtin?: string | null;
  householdId: string;
  id: string;
  sourceName?: string | null;
  sourceProductUrl?: string | null;
  status: "active" | "archived";
  stockGroupKey: string;
  updatedAt: string;
}

export interface HouseholdStockItemListItem {
  catalogProductId?: string | null;
  catalogProductNameSnapshot?: string | null;
  createdAt: string;
  currentAmount: number;
  displayName: string;
  gtin?: string | null;
  householdId: string;
  householdProductId: string;
  id: string;
  idealMaxLimit?: number | null;
  initialAmount: number;
  minLimit: number;
  note?: string | null;
  productSourceId?: string | null;
  sourceName?: string | null;
  sourceProductUrl?: string | null;
  status: "active" | "archived";
  stockedAt: string;
  stockGroupKey: string;
  stockStatus: "at_limit" | "below_limit" | "low_soon" | "steady";
  unit: string;
  updatedAt: string;
}

export interface HouseholdStockPage {
  household: HouseholdListItem;
  localProducts: HouseholdLocalProductListItem[];
  stockItems: HouseholdStockItemListItem[];
}

export interface CreateHouseholdStockInput {
  currentAmount: number;
  displayName: string;
  gtin?: string | null;
  householdId: string;
  idealMaxLimit?: number | null;
  initialAmount?: number;
  minLimit: number;
  note?: string | null;
  productSourceId?: string | null;
  sourceName?: string | null;
  sourceProductUrl?: string | null;
  stockedAt: string;
  stockGroupKey: string;
  unit: string;
}

export interface UpdateHouseholdStockInput {
  currentAmount?: number;
  displayName?: string;
  gtin?: string | null;
  householdId: string;
  id: string;
  idealMaxLimit?: number | null;
  initialAmount?: number;
  minLimit?: number;
  note?: string | null;
  productSourceId?: string | null;
  sourceName?: string | null;
  sourceProductUrl?: string | null;
  stockedAt?: string;
  stockGroupKey?: string;
  unit?: string;
}

export interface HouseholdShop {
  countryCode: string;
  createdAt: string;
  id: string;
  label: string;
  sourceNames: string[];
  status: "active" | "archived";
  storeBrandKeys: string[];
  updatedAt: string;
}

export interface HouseholdObservedPriceInput {
  amount: number;
  currencyCode: string;
  observedAt: string;
}

export interface HouseholdShoppingListLine {
  catalogProductId?: string | null;
  catalogProductNameSnapshot?: string | null;
  currentAmount?: number | null;
  displayName: string;
  gtin?: string | null;
  householdProductId?: string | null;
  householdStockItemId?: string | null;
  id: string;
  idealMaxLimit?: number | null;
  minLimit?: number | null;
  observedPrice?: HouseholdObservedPriceInput | null;
  plannedAmount: number;
  productSourceId?: string | null;
  purchasedAmount: number;
  reasonCode?: "at_limit" | "below_minimum" | "low_soon" | "stock_up" | null;
  sourceKind: "generated" | "manual";
  sourceName?: string | null;
  sourceProductUrl?: string | null;
  status: "applied" | "not_applied";
  stockGroupKey?: string | null;
  stockStatus?: "at_limit" | "below_limit" | "low_soon" | "steady" | null;
  suggestedBuyAmount: number;
  targetAmount: number;
  ticked: boolean;
  uncertaintyFlags: Array<"missing_catalog_product" | "missing_product_source">;
  unit: string;
}

export interface HouseholdShoppingList {
  createdAt: string;
  createdByUserId: string;
  householdId: string;
  id: string;
  items: HouseholdShoppingListLine[];
  scale: "business_as_usual" | "keep_it_chill" | "stock_em_up";
  schemaVersion: string;
  shopId?: string | null;
  status: "active" | "completed";
  stockAppliedAt?: string | null;
  updatedAt: string;
  updatedByUserId: string;
}

export interface HouseholdShoppingListPreviewItem {
  catalogProductId?: string | null;
  catalogProductNameSnapshot?: string | null;
  currentAmount: number;
  displayName: string;
  gtin?: string | null;
  householdProductId?: string | null;
  householdStockItemId?: string | null;
  idealMaxLimit?: number | null;
  productSourceId?: string | null;
  reasonCode: "at_limit" | "below_minimum" | "low_soon" | "stock_up";
  sourceName?: string | null;
  sourceProductUrl?: string | null;
  stockGroupKey?: string | null;
  stockStatus: "at_limit" | "below_limit" | "low_soon" | "steady";
  suggestedBuyAmount: number;
  targetAmount: number;
  uncertaintyFlags: Array<"missing_catalog_product" | "missing_product_source">;
  unit: string;
}

export interface HouseholdShoppingListPreview {
  householdId: string;
  itemCount: number;
  items: HouseholdShoppingListPreviewItem[];
  scale: "business_as_usual" | "keep_it_chill" | "stock_em_up";
}

export interface CreateHouseholdShoppingListInput {
  householdId: string;
  scale: "business_as_usual" | "keep_it_chill" | "stock_em_up";
  shopId?: string | null;
}

export interface UpdateHouseholdShoppingListInput {
  householdId: string;
  id: string;
  items?: HouseholdShoppingListLine[];
  shopId?: string | null;
}

export interface UpdateHouseholdShoppingListStocksInput {
  confirmationMode?: "tick_all_and_update" | "update_ticked_only" | null;
  householdId: string;
  id: string;
  stockAppliedAt: string;
}

interface HouseholdListResponse {
  households: HouseholdListItem[];
}

interface HouseholdCreateResponse {
  household: HouseholdListItem;
}

interface HouseholdShoppingListResponse {
  shoppingList: HouseholdShoppingList;
}

type HouseholdShoppingListPreviewResponse = HouseholdShoppingListPreview;

interface HouseholdShopListResponse {
  shops: HouseholdShop[];
}

interface HouseholdShoppingListStockUpdateResponse {
  allowedConfirmationModes?: Array<"tick_all_and_update" | "update_ticked_only">;
  appliedLineCount: number;
  confirmationRequired: boolean;
  householdStockPage?: HouseholdStockPage;
  shoppingList: HouseholdShoppingList;
}

type HouseholdError = {
  message: string;
  status: "forbidden" | "not_configured" | "not_found" | "unauthenticated" | "unavailable";
};

export type HouseholdListResult =
  | {
      households: HouseholdListItem[];
      status: "ok";
    }
  | HouseholdError;

export type HouseholdPageResult =
  | {
      page: HouseholdStockPage;
      status: "ok";
    }
  | HouseholdError;

export type HouseholdCreateResult =
  | {
      household: HouseholdListItem;
      status: "ok";
    }
  | HouseholdError;

export type HouseholdShoppingListResult =
  | {
      shoppingList: HouseholdShoppingList;
      status: "ok";
    }
  | HouseholdError;

export type HouseholdShoppingListPreviewResult =
  | {
      preview: HouseholdShoppingListPreview;
      status: "ok";
    }
  | HouseholdError;

export type HouseholdShopsResult =
  | {
      shops: HouseholdShop[];
      status: "ok";
    }
  | HouseholdError;

export type HouseholdShoppingListStockUpdateResult =
  | {
      appliedLineCount: number;
      householdStockPage: HouseholdStockPage;
      shoppingList: HouseholdShoppingList;
      status: "ok";
    }
  | {
      allowedConfirmationModes: Array<"tick_all_and_update" | "update_ticked_only">;
      shoppingList: HouseholdShoppingList;
      status: "confirmation_required";
    }
  | HouseholdError;

@Injectable({
  providedIn: "root"
})
export class HouseholdStockService {
  private readonly auth = inject(AuthService);
  private readonly loc = inject(LocalizationService);
  private readonly toast = inject(ToastService);

  async listHouseholds(): Promise<HouseholdListResult> {
    if (!this.auth.token()) {
      return {
        message: this.loc.t("household.signInBeforeLoad"),
        status: "unauthenticated"
      };
    }

    const response = await fetch(buildApiUrl("/api/households"), {
      headers: {
        accept: "application/json",
        ...this.auth.getAuthorizationHeaders()
      },
      method: "GET"
    });
    const error = await this.readHouseholdError(response, this.loc.t("household.routeError"));
    if (error) {
      return this.withToast(error);
    }

    const payload = (await response.json()) as HouseholdListResponse;
    return {
      households: payload.households,
      status: "ok"
    };
  }

  async createHousehold(name: string): Promise<HouseholdCreateResult> {
    if (!this.auth.token()) {
      return {
        message: this.loc.t("household.signInBeforeCreate"),
        status: "unauthenticated"
      };
    }

    const response = await fetch(buildApiUrl("/api/households"), {
      body: JSON.stringify({ name }),
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        ...this.auth.getAuthorizationHeaders()
      },
      method: "POST"
    });
    const error = await this.readHouseholdError(response, this.loc.t("household.createFailure"));
    if (error) {
      return this.withToast(error);
    }

    const payload = (await response.json()) as HouseholdCreateResponse;
    return {
      household: payload.household,
      status: "ok"
    };
  }

  async loadHouseholdStock(householdId: string): Promise<HouseholdPageResult> {
    if (!this.auth.token()) {
      return {
        message: this.loc.t("household.signInBeforeLoad"),
        status: "unauthenticated"
      };
    }

    const response = await fetch(buildApiUrl(`/api/household/items?householdId=${encodeURIComponent(householdId)}`), {
      headers: {
        accept: "application/json",
        ...this.auth.getAuthorizationHeaders()
      },
      method: "GET"
    });
    const error = await this.readHouseholdError(response, this.loc.t("household.routeError"));
    if (error) {
      return this.withToast(error);
    }

    return {
      page: await response.json() as HouseholdStockPage,
      status: "ok"
    };
  }

  async createStockItem(input: CreateHouseholdStockInput): Promise<HouseholdPageResult> {
    return await this.writeHouseholdStock(buildApiUrl("/api/household/items"), "POST", input);
  }

  async updateStockItem(input: UpdateHouseholdStockInput): Promise<HouseholdPageResult> {
    return await this.writeHouseholdStock(buildApiUrl("/api/household/items"), "PATCH", input);
  }

  async archiveStockItem(input: { householdId: string; id: string }): Promise<HouseholdPageResult> {
    if (!this.auth.token()) {
      return {
        message: this.loc.t("household.signInBeforeEdit"),
        status: "unauthenticated"
      };
    }

    const response = await fetch(
      buildApiUrl(`/api/household/items?householdId=${encodeURIComponent(input.householdId)}&id=${encodeURIComponent(input.id)}`),
      {
        headers: {
          accept: "application/json",
          ...this.auth.getAuthorizationHeaders()
        },
        method: "DELETE"
      }
    );
    const error = await this.readHouseholdError(response, this.loc.t("household.saveFailure"));
    if (error) {
      return this.withToast(error);
    }

    return {
      page: await response.json() as HouseholdStockPage,
      status: "ok"
    };
  }

  async previewShoppingList(input: CreateHouseholdShoppingListInput): Promise<HouseholdShoppingListPreviewResult> {
    if (!this.auth.token()) {
      return {
        message: this.loc.t("household.signInBeforeLoad"),
        status: "unauthenticated"
      };
    }

    const response = await fetch(buildApiUrl("/api/household/shopping-list/preview"), {
      body: JSON.stringify(input),
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        ...this.auth.getAuthorizationHeaders()
      },
      method: "POST"
    });
    const error = await this.readHouseholdError(response, this.loc.t("household.shoppingListLoadFailure"));
    if (error) {
      return this.withToast(error);
    }

    return {
      preview: await response.json() as HouseholdShoppingListPreviewResponse,
      status: "ok"
    };
  }

  async createShoppingList(input: CreateHouseholdShoppingListInput): Promise<HouseholdShoppingListResult> {
    return await this.writeShoppingList(buildApiUrl("/api/household/shopping-lists"), "POST", input);
  }

  async loadLatestShoppingList(householdId: string): Promise<HouseholdShoppingListResult> {
    if (!this.auth.token()) {
      return {
        message: this.loc.t("household.signInBeforeLoad"),
        status: "unauthenticated"
      };
    }

    const response = await fetch(buildApiUrl(`/api/household/shopping-lists/latest?householdId=${encodeURIComponent(householdId)}`), {
      headers: {
        accept: "application/json",
        ...this.auth.getAuthorizationHeaders()
      },
      method: "GET"
    });
    const error = await this.readHouseholdError(response, this.loc.t("household.shoppingListLoadFailure"));
    if (error) {
      return error.status === "not_found"
        ? error
        : this.withToast(error);
    }

    return {
      shoppingList: (await response.json() as HouseholdShoppingListResponse).shoppingList,
      status: "ok"
    };
  }

  async updateShoppingList(input: UpdateHouseholdShoppingListInput): Promise<HouseholdShoppingListResult> {
    return await this.writeShoppingList(buildApiUrl("/api/household/shopping-lists"), "PATCH", input);
  }

  async updateShoppingListStocks(
    input: UpdateHouseholdShoppingListStocksInput
  ): Promise<HouseholdShoppingListStockUpdateResult> {
    if (!this.auth.token()) {
      return {
        message: this.loc.t("household.signInBeforeEdit"),
        status: "unauthenticated"
      };
    }

    const response = await fetch(buildApiUrl("/api/household/shopping-lists/update-stocks"), {
      body: JSON.stringify(input),
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        ...this.auth.getAuthorizationHeaders()
      },
      method: "POST"
    });
    if (response.status === 409) {
      const payload = await response.json() as HouseholdShoppingListStockUpdateResponse;
      return {
        allowedConfirmationModes: payload.allowedConfirmationModes ?? [],
        shoppingList: payload.shoppingList,
        status: "confirmation_required"
      };
    }

    const error = await this.readHouseholdError(response, this.loc.t("household.shoppingListApplyFailure"));
    if (error) {
      return this.withToast(error);
    }

    const payload = await response.json() as HouseholdShoppingListStockUpdateResponse;
    return {
      appliedLineCount: payload.appliedLineCount,
      householdStockPage: payload.householdStockPage as HouseholdStockPage,
      shoppingList: payload.shoppingList,
      status: "ok"
    };
  }

  async listShops(): Promise<HouseholdShopsResult> {
    if (!this.auth.token()) {
      return {
        message: this.loc.t("household.signInBeforeLoad"),
        status: "unauthenticated"
      };
    }

    const response = await fetch(buildApiUrl("/api/shops"), {
      headers: {
        accept: "application/json",
        ...this.auth.getAuthorizationHeaders()
      },
      method: "GET"
    });
    const error = await this.readHouseholdError(response, this.loc.t("household.shoppingListLoadFailure"));
    if (error) {
      return this.withToast(error);
    }

    return {
      shops: (await response.json() as HouseholdShopListResponse).shops,
      status: "ok"
    };
  }

  private async writeHouseholdStock(
    url: string,
    method: "PATCH" | "POST",
    body: unknown
  ): Promise<HouseholdPageResult> {
    if (!this.auth.token()) {
      return {
        message: this.loc.t("household.signInBeforeEdit"),
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
    const error = await this.readHouseholdError(response, this.loc.t("household.saveFailure"));
    if (error) {
      return this.withToast(error);
    }

    return {
      page: await response.json() as HouseholdStockPage,
      status: "ok"
    };
  }

  private async writeShoppingList(
    url: string,
    method: "PATCH" | "POST",
    body: unknown
  ): Promise<HouseholdShoppingListResult> {
    if (!this.auth.token()) {
      return {
        message: this.loc.t("household.signInBeforeEdit"),
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
    const error = await this.readHouseholdError(response, this.loc.t("household.shoppingListSaveFailure"));
    if (error) {
      return this.withToast(error);
    }

    return {
      shoppingList: (await response.json() as HouseholdShoppingListResponse).shoppingList,
      status: "ok"
    };
  }

  private async readHouseholdError(
    response: Response,
    fallback: string
  ): Promise<HouseholdError | null> {
    if (response.status === 401) {
      return {
        message: this.loc.t("household.accessDenied"),
        status: "forbidden"
      };
    }

    if (response.status === 404) {
      return {
        message: this.loc.t("household.notFound"),
        status: "not_found"
      };
    }

    if (response.status === 503) {
      return {
        message: this.loc.t("household.notConfigured"),
        status: "not_configured"
      };
    }

    if (!response.ok) {
      return {
        message: await readApiErrorMessage(response, fallback),
        status: "unavailable"
      };
    }

    return null;
  }

  private withToast<T extends HouseholdError>(error: T): T {
    this.toast.push(error.message, "error");
    return error;
  }
}
