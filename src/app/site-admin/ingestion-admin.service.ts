import { Injectable, inject } from "@angular/core";

import { AuthService } from "../auth.service";

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

interface IngestionSnapshotsResponse {
  processorName: string;
  processorVersion: string;
  snapshots: IngestionSnapshotListItem[];
}

interface ProcessSnapshotResponse {
  processedRowCount: number;
  skippedRowCount: number;
  snapshotId: string;
}

export type IngestionAdminLoadResult =
  | {
      processorName: string;
      processorVersion: string;
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

@Injectable({
  providedIn: "root"
})
export class IngestionAdminService {
  private readonly auth = inject(AuthService);

  async listSnapshots(): Promise<IngestionAdminLoadResult> {
    if (!this.auth.token()) {
      return {
        message: "Sign in before loading crawl snapshots.",
        status: "unauthenticated"
      };
    }

    const response = await fetch("/api/admin/ingestion/snapshots", {
      headers: {
        accept: "application/json",
        ...this.auth.getAuthorizationHeaders()
      },
      method: "GET"
    });

    if (response.status === 401) {
      return {
        message: "The current session does not have access to crawl snapshots.",
        status: "forbidden"
      };
    }

    if (response.status === 503) {
      return {
        message: "The ingestion database is not configured for this environment.",
        status: "not_configured"
      };
    }

    if (!response.ok) {
      return {
        message: "The crawl snapshot route returned an error.",
        status: "unavailable"
      };
    }

    const payload = (await response.json()) as IngestionSnapshotsResponse;

    return {
      processorName: payload.processorName,
      processorVersion: payload.processorVersion,
      snapshots: payload.snapshots,
      status: "ok"
    };
  }

  async processSnapshot(snapshotId: string): Promise<ProcessSnapshotResult> {
    if (!this.auth.token()) {
      return {
        message: "Sign in before processing crawl snapshots.",
        status: "unauthenticated"
      };
    }

    const response = await fetch("/api/admin/ingestion/process-snapshot", {
      body: JSON.stringify({ snapshotId }),
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        ...this.auth.getAuthorizationHeaders()
      },
      method: "POST"
    });

    if (response.status === 401) {
      return {
        message: "The current session does not have access to process snapshots.",
        status: "forbidden"
      };
    }

    if (response.status === 404) {
      return {
        message: "The selected snapshot no longer exists.",
        status: "not_found"
      };
    }

    if (response.status === 503) {
      return {
        message: "Snapshot processing is not configured for this environment.",
        status: "not_configured"
      };
    }

    if (!response.ok) {
      return {
        message: "Snapshot processing returned an error.",
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
}
