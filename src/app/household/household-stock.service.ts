import { Injectable, inject } from "@angular/core";

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
  initialAmount: number;
  minLimit: number;
  note?: string | null;
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
  initialAmount?: number;
  minLimit: number;
  note?: string | null;
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
  initialAmount?: number;
  minLimit?: number;
  note?: string | null;
  sourceName?: string | null;
  sourceProductUrl?: string | null;
  stockedAt?: string;
  stockGroupKey?: string;
  unit?: string;
}

interface HouseholdListResponse {
  households: HouseholdListItem[];
}

interface HouseholdCreateResponse {
  household: HouseholdListItem;
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

    const response = await fetch("/api/households", {
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

    const response = await fetch("/api/households", {
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

    const response = await fetch(`/api/household/items?householdId=${encodeURIComponent(householdId)}`, {
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
    return await this.writeHouseholdStock("/api/household/items", "POST", input);
  }

  async updateStockItem(input: UpdateHouseholdStockInput): Promise<HouseholdPageResult> {
    return await this.writeHouseholdStock("/api/household/items", "PATCH", input);
  }

  async archiveStockItem(input: { householdId: string; id: string }): Promise<HouseholdPageResult> {
    if (!this.auth.token()) {
      return {
        message: this.loc.t("household.signInBeforeEdit"),
        status: "unauthenticated"
      };
    }

    const response = await fetch(
      `/api/household/items?householdId=${encodeURIComponent(input.householdId)}&id=${encodeURIComponent(input.id)}`,
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

  showShoppingListComingSoon(): void {
    this.toast.push(this.loc.t("household.shoppingListComingSoon"), "info");
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
