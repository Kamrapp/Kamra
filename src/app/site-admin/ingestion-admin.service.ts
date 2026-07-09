import { Injectable, inject } from "@angular/core";

import { buildApiUrl } from "../api-url";
import { AuthService } from "../auth.service";
import { readApiErrorMessage } from "../shared/api-errors";
import { LocalizationService } from "../shared/localization.service";
import { ToastService } from "../shared/toast.service";

export interface IngestionRowPreview {
  displayName: string;
  packageLabel?: string | null;
  priceCount: number;
  priceText?: string | null;
  priceValue?: number | null;
  sourceProductKey?: string | null;
  sourceRecordId?: string | null;
  validFrom?: string | null;
  validTo?: string | null;
}

export interface IngestionProcessingState {
  attemptCount: number;
  lastErrorCode?: string | null;
  lastErrorMessage?: string | null;
  lastProcessedAt?: string | null;
  state: "failed" | "pending" | "processed" | "reset_requested" | "skipped" | "stale";
}

export interface IngestionSnapshotListItem {
  capturedAt: string;
  contentHash: string;
  contentType: string;
  crawlDate: string;
  crawlRunId: string;
  id: string;
  parserName: string;
  parserVersion: string;
  parsedRowCount: number;
  processingState?: IngestionProcessingState | null;
  rows: IngestionRowPreview[];
  rowPreviewLimit: number;
  sourceName: string;
  sourceRecordId: string;
  sourceUrl?: string | null;
  workflowName: string;
}

export const productReviewDecisionReasons = [
  "bad_name",
  "bad_price",
  "duplicate",
  "non_product",
  "online_only",
  "unsupported_layout",
  "other"
] as const;

export type ProductReviewDecisionReason = (typeof productReviewDecisionReasons)[number];

export interface ProductReviewCandidateDraft {
  matchConfidence: "name_only" | "none" | "source_scoped_name" | "strong_identifier" | "strong_source_key";
  origin: {
    capturedAt: string;
    sourceName: string;
    sourceRecordId: string;
    sourceUrl?: string | null;
  };
  priceObservations: unknown[];
  product: {
    brandName?: string | null;
    kind: "grocery";
    measurements: unknown[];
    name: string;
    normalizedName: string;
    primaryCategoryKey?: string | null;
  };
  source: {
    countryCode: "HU";
    currentCategoryLabel?: string | null;
    productPageUrl?: string | null;
    sourceName: string;
    sourceProductKey: string;
    sourceProductName: string;
    storeBrandKey: string;
  };
  sourceProductIdentifiers: unknown[];
  stock?: {
    availability: "infinite";
    countryCode: "HU";
  };
}

export interface IngestionProductReviewItem {
  candidate: ProductReviewCandidateDraft;
  candidateMatch: ProductReviewCandidateDraft["matchConfidence"];
  decision?: {
    declineReason?: ProductReviewDecisionReason | null;
    note?: string | null;
    state: "accepted" | "declined";
  } | null;
  id: string;
  rawRowPreview: Record<string, unknown>;
  rowIndex: number;
  snapshotId: string;
  sourceName: string;
  sourceRecordId: string;
  status: "accepted" | "declined" | "failed" | "pending" | "stale";
}

interface IngestionSnapshotsResponse {
  pagination?: {
    hasNextPage: boolean;
    page: number;
    pageSize: number;
  };
  processorName: string;
  processorVersion: string;
  sourceNames?: string[];
  snapshots: IngestionSnapshotListItem[];
}

interface ProcessSnapshotResponse {
  processedRowCount: number;
  skippedRowCount: number;
  snapshotId: string;
}

interface ProductReviewItemsResponse {
  reviewItems: IngestionProductReviewItem[];
}

interface ProductReviewItemResponse {
  reviewItem: IngestionProductReviewItem;
}

interface ProductReviewDecisionResponse {
  acceptedCatalogProductId?: string | null;
  id: string;
  status: "accepted" | "declined";
}

export interface ProductReviewAcceptancePreview {
  action: "create" | "merge";
  existingProduct?: {
    id: string;
    name: string;
    sourceNames: string[];
  } | null;
  productId: string;
  reason: string;
  reviewItemId: string;
}

interface ProductReviewAcceptancePreviewResponse {
  preview: ProductReviewAcceptancePreview;
}

export type IngestionAdminLoadResult =
  | {
      pagination: {
        hasNextPage: boolean;
        page: number;
        pageSize: number;
      };
      processorName: string;
      processorVersion: string;
      sourceNames: string[];
      snapshots: IngestionSnapshotListItem[];
      status: "ok";
    }
  | {
      message: string;
      status: "forbidden" | "not_configured" | "unavailable" | "unauthenticated";
    };

export type ProcessSnapshotResult =
  | {
      processedRowCount: number;
      skippedRowCount: number;
      status: "ok";
    }
  | {
      message: string;
      status: "forbidden" | "not_found" | "not_configured" | "unavailable" | "unauthenticated";
    };

type ProductReviewError = {
  message: string;
  status: "forbidden" | "not_found" | "not_configured" | "unavailable" | "unauthenticated";
};

export type ProductReviewItemResult =
  | {
      reviewItem: IngestionProductReviewItem;
      status: "ok";
    }
  | ProductReviewError;

export type ProductReviewDecisionResult =
  | {
      decision: ProductReviewDecisionResponse;
      status: "ok";
    }
  | ProductReviewError;

export type ProductReviewItemsResult =
  | {
      reviewItems: IngestionProductReviewItem[];
      status: "ok";
    }
  | ProductReviewError;

export type ProductReviewAcceptancePreviewResult =
  | {
      preview: ProductReviewAcceptancePreview;
      status: "ok";
    }
  | ProductReviewError;

@Injectable({
  providedIn: "root"
})
export class IngestionAdminService {
  private readonly auth = inject(AuthService);
  private readonly loc = inject(LocalizationService);
  private readonly toast = inject(ToastService);

  async listSnapshots(
    includeAccepted = false,
    page = 1,
    pageSize = 25,
    sourceNames: readonly string[] = []
  ): Promise<IngestionAdminLoadResult> {
    if (!this.auth.token()) {
      return {
        message: this.loc.t("crawl.signInBeforeLoad"),
        status: "unauthenticated"
      };
    }

    const searchParams = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize)
    });
    if (includeAccepted) {
      searchParams.set("includeAccepted", "true");
    }
    for (const sourceName of sourceNames) {
      searchParams.append("source", sourceName);
    }

    const url = buildApiUrl(`/api/admin/ingestion/snapshots?${searchParams.toString()}`);
    const response = await fetch(url, {
      headers: {
        accept: "application/json",
        ...this.auth.getAuthorizationHeaders()
      },
      method: "GET"
    });

    if (response.status === 401) {
      return this.withToast({
        message: this.loc.t("crawl.snapshotAccess"),
        status: "forbidden"
      });
    }

    if (response.status === 503) {
      return this.withToast({
        message: this.loc.t("crawl.snapshotDatabaseMissing"),
        status: "not_configured"
      });
    }

    if (!response.ok) {
      const message = await readApiErrorMessage(response, this.loc.t("crawl.snapshotRouteError"));
      return {
        message: this.toastMessage(message),
        status: "unavailable"
      };
    }

    const payload = (await response.json()) as IngestionSnapshotsResponse;

    return {
      pagination: payload.pagination ?? {
        hasNextPage: false,
        page,
        pageSize
      },
      processorName: payload.processorName,
      processorVersion: payload.processorVersion,
      sourceNames: payload.sourceNames ?? [],
      snapshots: payload.snapshots,
      status: "ok"
    };
  }

  async processSnapshot(snapshotId: string): Promise<ProcessSnapshotResult> {
    if (!this.auth.token()) {
      return {
        message: this.loc.t("crawl.signInBeforeProcess"),
        status: "unauthenticated"
      };
    }

    const response = await fetch(buildApiUrl("/api/admin/ingestion/process-snapshot"), {
      body: JSON.stringify({ snapshotId }),
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        ...this.auth.getAuthorizationHeaders()
      },
      method: "POST"
    });

    if (response.status === 401) {
      return this.withToast({
        message: this.loc.t("crawl.processAccess"),
        status: "forbidden"
      });
    }

    if (response.status === 404) {
      return this.withToast({
        message: this.loc.t("crawl.snapshotMissing"),
        status: "not_found"
      });
    }

    if (response.status === 503) {
      return this.withToast({
        message: this.loc.t("crawl.processingMissing"),
        status: "not_configured"
      });
    }

    if (!response.ok) {
      const message = await readApiErrorMessage(response, this.loc.t("crawl.processRouteError"));
      return {
        message: this.toastMessage(message),
        status: "unavailable"
      };
    }

    const payload = (await response.json()) as ProcessSnapshotResponse;

    return {
      processedRowCount: payload.processedRowCount,
      skippedRowCount: payload.skippedRowCount,
      status: "ok"
    };
  }

  async prepareReviewItems(snapshotId: string): Promise<ProductReviewItemsResult> {
    return await this.writeReviewItem(buildApiUrl("/api/admin/ingestion/prepare-review-items"), {
      snapshotId
    }, "reviewItems") as ProductReviewItemsResult;
  }

  async listReviewItemsForSnapshot(snapshotId: string): Promise<ProductReviewItemsResult> {
    if (!this.auth.token()) {
      return {
        message: this.loc.t("crawl.signInBeforeReviewItems"),
        status: "unauthenticated"
      };
    }

    const response = await fetch(buildApiUrl(`/api/admin/ingestion/review-items?snapshotId=${encodeURIComponent(snapshotId)}&limit=250`), {
      headers: {
        accept: "application/json",
        ...this.auth.getAuthorizationHeaders()
      },
      method: "GET"
    });
    const error = await this.readReviewItemError(response);
    if (error) {
      return this.withToast(error);
    }

    const payload = (await response.json()) as ProductReviewItemsResponse;
    return {
      reviewItems: payload.reviewItems,
      status: "ok"
    };
  }

  async updateReviewItemCandidate(
    id: string,
    candidate: ProductReviewCandidateDraft
  ): Promise<ProductReviewItemResult> {
    return await this.writeReviewItem(buildApiUrl("/api/admin/ingestion/review-item"), {
      candidate,
      id
    }, "reviewItem", "PATCH") as ProductReviewItemResult;
  }

  async acceptReviewItem(id: string, note: string | null): Promise<ProductReviewDecisionResult> {
    return await this.writeReviewItem(buildApiUrl("/api/admin/ingestion/review-item/accept"), {
      id,
      note
    }, "decision") as ProductReviewDecisionResult;
  }

  async previewReviewItemAcceptance(id: string): Promise<ProductReviewAcceptancePreviewResult> {
    if (!this.auth.token()) {
      return {
        message: this.loc.t("crawl.signInBeforePreview"),
        status: "unauthenticated"
      };
    }

    const response = await fetch(buildApiUrl(`/api/admin/ingestion/review-item/acceptance-preview?id=${encodeURIComponent(id)}`), {
      headers: {
        accept: "application/json",
        ...this.auth.getAuthorizationHeaders()
      },
      method: "GET"
    });
    const error = await this.readReviewItemError(response);
    if (error) {
      return this.withToast(error);
    }

    const payload = (await response.json()) as ProductReviewAcceptancePreviewResponse;
    return {
      preview: payload.preview,
      status: "ok"
    };
  }

  async declineReviewItem(
    id: string,
    declineReason: ProductReviewDecisionReason,
    note: string | null
  ): Promise<ProductReviewDecisionResult> {
    return await this.writeReviewItem(buildApiUrl("/api/admin/ingestion/review-item/decline"), {
      declineReason,
      id,
      note
    }, "decision") as ProductReviewDecisionResult;
  }

  private async writeReviewItem(
    url: string,
    body: unknown,
    responseKind: "decision" | "reviewItem" | "reviewItems",
    method: "PATCH" | "POST" = "POST"
  ): Promise<ProductReviewItemResult | ProductReviewItemsResult | ProductReviewDecisionResult> {
    if (!this.auth.token()) {
      return {
        message: this.loc.t("crawl.signInBeforeReviewEdit"),
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
    const error = await this.readReviewItemError(response);
    if (error) {
      return this.withToast(error);
    }

    if (responseKind === "reviewItems") {
      const payload = (await response.json()) as ProductReviewItemsResponse;
      return {
        reviewItems: payload.reviewItems,
        status: "ok"
      };
    }

    if (responseKind === "decision") {
      const payload = (await response.json()) as ProductReviewDecisionResponse;
      return {
        decision: payload,
        status: "ok"
      };
    }

    const payload = (await response.json()) as ProductReviewItemResponse;
    return {
      reviewItem: payload.reviewItem,
      status: "ok"
    };
  }

  private toastMessage(message: string): string {
    this.toast.push(message, "error");
    return message;
  }

  private withToast<T extends ProductReviewError>(error: T): T {
    this.toast.push(error.message, "error");
    return error;
  }

  private async readReviewItemError(response: Response): Promise<ProductReviewError | null> {
    if (response.status === 401) {
      return {
        message: this.loc.t("crawl.reviewAccess"),
        status: "forbidden"
      };
    }

    if (response.status === 404) {
      return {
        message: this.loc.t("crawl.reviewItemMissing"),
        status: "not_found"
      };
    }

    if (response.status === 503) {
      return {
        message: this.loc.t("crawl.snapshotDatabaseMissing"),
        status: "not_configured"
      };
    }

    if (!response.ok) {
      const message = await readApiErrorMessage(response, this.loc.t("crawl.reviewRouteError"));
      return {
        message,
        status: "unavailable"
      };
    }

    return null;
  }
}
