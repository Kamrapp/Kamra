import {
  createDefaultCatalogRepository,
  createDefaultIngestionRepository,
  json,
  unauthorized,
  type AppResponse,
  type AppRoute,
  type AppRouteContext
} from "../app-route-context.js";
import type { UserRole } from "../../auth/user-auth.js";
import {
  createSourceOfferRecordFingerprint,
  processSourceOfferSnapshot,
  sourceOfferProcessorName,
  sourceOfferProcessorVersion
} from "../../ingestion/processing/source-offer-processor.js";
import type { IngestionRawSnapshotRecord, ParsedShopProductRow } from "../../ingestion/v1/contracts.js";
import {
  productReviewDecisionReasons,
  productReviewCandidateMatchConfidences,
  type IngestionProductReviewItemRecord,
  type ProductReviewCandidateDraft,
  type ProductReviewDecisionReason
} from "../../ingestion/v1/review-contracts.js";

const snapshotListLimit = 75;
const rowPreviewLimit = 250;
const reviewItemListLimit = 100;

type CatalogRouteRepository = ReturnType<NonNullable<AppRouteContext["dependencies"]["createCatalogRepository"]>>;
type IngestionRouteRepository = ReturnType<NonNullable<AppRouteContext["dependencies"]["createIngestionRepository"]>>;

export const ingestionSnapshotsRoute: AppRoute = {
  match: (request) => request.method === "GET" && request.path === "/api/admin/ingestion/snapshots",
  handle: async (request, context) => {
    const user = requireUserRole("admin", request, context, "Sign in as an admin to view ingestion snapshots.");
    if ("status" in user) {
      return user;
    }

    const repositories = await createIngestionRouteRepositories(context);
    if ("error" in repositories) {
      return repositories.error;
    }

    const { catalogRepository, ingestionRepository } = repositories;

    await setupIngestionRouteCollections(repositories);

    const includeAcceptedItems = parseBooleanQueryValue(request.query?.["includeAccepted"]);
    const snapshots = await ingestionRepository.listRawSnapshots({ limit: snapshotListLimit });
    const items = (await Promise.all(snapshots.map(async (snapshot) => {
      const visibleRows = includeAcceptedItems
        ? snapshot.parsedRows
        : await listVisibleSnapshotRows(ingestionRepository, snapshot);
      if (visibleRows.length === 0) {
        return null;
      }

      return {
        ...toSnapshotListItem(snapshot, visibleRows),
        processingState: catalogRepository.findProcessingState
          ? await catalogRepository.findProcessingState({
              processorName: sourceOfferProcessorName,
              processorVersion: sourceOfferProcessorVersion,
              recordFingerprint: createSourceOfferRecordFingerprint(snapshot),
              sourceName: snapshot.sourceName
            })
          : null
      };
    }))).filter((item): item is NonNullable<typeof item> => item !== null);

    return json(200, {
      processorName: sourceOfferProcessorName,
      processorVersion: sourceOfferProcessorVersion,
      snapshots: items
    });
  }
};

export const processIngestionSnapshotRoute: AppRoute = {
  match: (request) => request.method === "POST" && request.path === "/api/admin/ingestion/process-snapshot",
  handle: async (request, context) => {
    const user = requireUserRole("admin", request, context, "Sign in as an admin to process ingestion snapshots.");
    if ("status" in user) {
      return user;
    }

    const snapshotId = parseSnapshotId(request.bodyText);
    if (!snapshotId) {
      return json(400, {
        error: "invalid_snapshot_id"
      });
    }

    const repositories = await createIngestionRouteRepositories(context);
    if ("error" in repositories) {
      return repositories.error;
    }

    const { catalogRepository, ingestionRepository } = repositories;

    if (!catalogRepository.upsertCatalogSeedDataset) {
      return json(503, { error: "processor_not_available" });
    }

    await setupIngestionRouteCollections(repositories);

    const snapshot = await ingestionRepository.findRawSnapshotById(snapshotId);
    if (!snapshot) {
      return json(404, {
        error: "snapshot_not_found"
      });
    }

    const result = processSourceOfferSnapshot(snapshot);
    await catalogRepository.upsertCatalogSeedDataset(result.dataset);

    return json(200, {
      processedRowCount: result.processedRowCount,
      skippedRowCount: result.skippedRowCount,
      snapshotId: snapshot.id
    });
  }
};

export const prepareProductReviewItemsRoute: AppRoute = {
  match: (request) => request.method === "POST" && request.path === "/api/admin/ingestion/prepare-review-items",
  handle: async (request, context) => {
    const user = requireUserRole("admin", request, context, "Sign in as an admin to prepare review items.");
    if ("status" in user) {
      return user;
    }

    const snapshotId = parseSnapshotId(request.bodyText);
    if (!snapshotId) {
      return json(400, {
        error: "invalid_snapshot_id"
      });
    }

    const repositories = await createIngestionRouteRepositories(context);
    if ("error" in repositories) {
      return repositories.error;
    }

    const { ingestionRepository } = repositories;
    if (!ingestionRepository.prepareProductReviewItems) {
      return json(501, {
        error: "product_review_not_supported"
      });
    }

    await setupIngestionRouteCollections(repositories);

    const snapshot = await ingestionRepository.findRawSnapshotById(snapshotId);
    if (!snapshot) {
      return json(404, {
        error: "snapshot_not_found"
      });
    }

    const items = await ingestionRepository.prepareProductReviewItems(snapshot);

    return json(200, {
      preparedCount: items.length,
      reviewItems: items.map(toReviewItemResponse),
      snapshotId: snapshot.id
    });
  }
};

export const productReviewItemsRoute: AppRoute = {
  match: (request) => request.method === "GET" && request.path === "/api/admin/ingestion/review-items",
  handle: async (request, context) => {
    const user = requireUserRole("admin", request, context, "Sign in as an admin to view review items.");
    if ("status" in user) {
      return user;
    }

    const repositories = await createIngestionRouteRepositories(context);
    if ("error" in repositories) {
      return repositories.error;
    }

    const { ingestionRepository } = repositories;
    if (!ingestionRepository.listProductReviewItems) {
      return json(501, {
        error: "product_review_not_supported"
      });
    }

    await setupIngestionRouteCollections(repositories);

    const items = await ingestionRepository.listProductReviewItems({
      limit: parsePositiveIntegerQueryValue(request.query?.["limit"], reviewItemListLimit),
      offset: parsePositiveIntegerQueryValue(request.query?.["offset"], 0),
      snapshotId: parseOptionalQueryString(request.query?.["snapshotId"]),
      sourceName: parseOptionalQueryString(request.query?.["sourceName"]),
      status: parseReviewStatuses(request.query?.["status"])
    });

    return json(200, {
      reviewItems: items.map(toReviewItemResponse)
    });
  }
};

export const productReviewItemRoute: AppRoute = {
  match: (request) =>
    (request.method === "GET" || request.method === "PATCH")
      && request.path === "/api/admin/ingestion/review-item",
  handle: async (request, context) => {
    const user = requireUserRole("admin", request, context, "Sign in as an admin to manage review items.");
    if ("status" in user) {
      return user;
    }

    const repositories = await createIngestionRouteRepositories(context);
    if ("error" in repositories) {
      return repositories.error;
    }

    const { ingestionRepository } = repositories;
    if (!ingestionRepository.findProductReviewItemById) {
      return json(501, {
        error: "product_review_not_supported"
      });
    }

    await setupIngestionRouteCollections(repositories);

    if (request.method === "GET") {
      const id = parseOptionalQueryString(request.query?.["id"]);
      if (!id) {
        return json(400, {
          error: "invalid_review_item_id"
        });
      }

      const item = await ingestionRepository.findProductReviewItemById(id);
      if (!item) {
        return json(404, {
          error: "review_item_not_found"
        });
      }

      return json(200, {
        reviewItem: toReviewItemResponse(item)
      });
    }

    if (!ingestionRepository.updateProductReviewItemCandidate) {
      return json(501, {
        error: "product_review_not_supported"
      });
    }

    const payload = parseReviewItemUpdatePayload(request.bodyText);
    if (!payload) {
      return json(400, {
        error: "invalid_review_item_update"
      });
    }

    const updated = await ingestionRepository.updateProductReviewItemCandidate({
      candidate: payload.candidate,
      id: payload.id,
      updatedAt: new Date().toISOString()
    });
    if (!updated) {
      return json(404, {
        error: "review_item_not_found"
      });
    }

    const item = await ingestionRepository.findProductReviewItemById(payload.id);

    return json(200, {
      reviewItem: item ? toReviewItemResponse(item) : null
    });
  }
};

export const acceptProductReviewItemRoute: AppRoute = {
  match: (request) => request.method === "POST" && request.path === "/api/admin/ingestion/review-item/accept",
  handle: async (request, context) => markProductReviewItemDecision(request, context, "accepted")
};

export const declineProductReviewItemRoute: AppRoute = {
  match: (request) => request.method === "POST" && request.path === "/api/admin/ingestion/review-item/decline",
  handle: async (request, context) => markProductReviewItemDecision(request, context, "declined")
};

async function listVisibleSnapshotRows(
  ingestionRepository: IngestionRouteRepository,
  snapshot: IngestionRawSnapshotRecord
): Promise<ParsedShopProductRow[]> {
  if (!ingestionRepository.listProductReviewItems) {
    return snapshot.parsedRows;
  }

  const reviewItems = await ingestionRepository.listProductReviewItems({
    limit: Math.max(snapshot.parsedRows.length, 1),
    snapshotId: snapshot.id
  });
  if (reviewItems.length === 0) {
    return snapshot.parsedRows;
  }

  const acceptedRowIndexes = new Set(
    reviewItems
      .filter((item) => item.status === "accepted")
      .map((item) => item.rowIndex)
  );

  return snapshot.parsedRows.filter((_row, rowIndex) => !acceptedRowIndexes.has(rowIndex));
}

function toSnapshotListItem(
  snapshot: IngestionRawSnapshotRecord,
  visibleRows: ParsedShopProductRow[] = snapshot.parsedRows
): Record<string, unknown> {
  return {
    capturedAt: snapshot.capturedAt,
    contentHash: snapshot.contentHash,
    contentType: snapshot.contentType,
    crawlDate: snapshot.crawlDate,
    crawlRunId: snapshot.crawlRunId,
    id: snapshot.id,
    parserName: snapshot.parserName,
    parserVersion: snapshot.parserVersion,
    parsedRowCount: visibleRows.length,
    rows: visibleRows.slice(0, rowPreviewLimit).map(toRowPreview),
    rowPreviewLimit,
    sourceName: snapshot.sourceName,
    sourceRecordId: snapshot.sourceRecordId,
    sourceUrl: snapshot.sourceUrl ?? null,
    workflowName: snapshot.workflowName
  };
}

function toRowPreview(row: ParsedShopProductRow): Record<string, unknown> {
  return {
    displayName: row.displayName,
    packageLabel: row.packageLabel ?? null,
    priceCount: row.priceObservations?.length ?? 0,
    priceText: row.priceText ?? null,
    priceValue: row.priceObservations?.[0]?.price ?? row.priceValue ?? null,
    sourceProductKey: row.sourceProductKey ?? null,
    sourceRecordId: row.sourceRecordId ?? null,
    validFrom: row.validFrom ?? row.priceObservations?.[0]?.validFrom ?? null,
    validTo: row.validTo ?? row.priceObservations?.[0]?.validTo ?? null
  };
}

async function createIngestionRouteRepositories(context: AppRouteContext): Promise<
  | {
    catalogRepository: CatalogRouteRepository;
    ingestionRepository: IngestionRouteRepository;
  }
  | { error: AppResponse }
> {
  const config = context.config;
  if (!config.mongodb.uri || !config.mongodb.databaseName) {
    return {
      error: json(503, { error: "ingestion_not_configured" })
    };
  }

  const client = await context.getMongoClient(
    config.mongodb.uri,
    config.mongodb.dnsServers
  );
  const database = client.db(config.mongodb.databaseName);

  return {
    catalogRepository: context.dependencies.createCatalogRepository
      ? context.dependencies.createCatalogRepository(database)
      : createDefaultCatalogRepository(database),
    ingestionRepository: context.dependencies.createIngestionRepository
      ? context.dependencies.createIngestionRepository(database)
      : createDefaultIngestionRepository(database)
  };
}

async function setupIngestionRouteCollections(repositories: {
  catalogRepository: CatalogRouteRepository;
  ingestionRepository: IngestionRouteRepository;
}): Promise<void> {
  await Promise.all([
    repositories.ingestionRepository.setupCollections?.(),
    repositories.catalogRepository.setupCollections?.()
  ]);
}

function requireUserRole(
  role: UserRole,
  request: Parameters<AppRoute["handle"]>[0],
  context: AppRouteContext,
  message: string
): NonNullable<ReturnType<AppRouteContext["authenticateRequestUser"]>> | AppResponse {
  const user = context.authenticateRequestUser(request);
  if (!user || user.role !== role) {
    return unauthorized(message);
  }

  return user;
}

async function markProductReviewItemDecision(
  request: Parameters<AppRoute["handle"]>[0],
  context: AppRouteContext,
  status: "accepted" | "declined"
): Promise<AppResponse> {
  const user = requireUserRole("admin", request, context, "Sign in as an admin to decide review items.");
  if ("status" in user) {
    return user;
  }

  const repositories = await createIngestionRouteRepositories(context);
  if ("error" in repositories) {
    return repositories.error;
  }

  const { catalogRepository, ingestionRepository } = repositories;
  if (!ingestionRepository.markProductReviewItemDecision) {
      return json(501, {
        error: "product_review_not_supported"
      });
  }

  await setupIngestionRouteCollections(repositories);

  const payload = parseReviewDecisionPayload(request.bodyText, status);
  if (!payload) {
    return json(400, {
      error: "invalid_review_decision"
    });
  }

  let acceptedCatalogProductId = payload.acceptedCatalogProductId ?? null;
  if (status === "accepted") {
    const reviewItem = await ingestionRepository.findProductReviewItemById?.(payload.id);
    if (!reviewItem) {
      return json(404, {
        error: "review_item_not_found"
      });
    }

    if (!acceptedCatalogProductId) {
      if (!catalogRepository.createCatalogProductFromReviewCandidate) {
        return json(501, {
          error: "catalog_review_acceptance_not_supported"
        });
      }

      const createdProduct = await catalogRepository.createCatalogProductFromReviewCandidate({
        candidate: reviewItem.candidate,
        createdAt: new Date().toISOString(),
        reviewerId: user.email
      });
      acceptedCatalogProductId = createdProduct.productId;
    }
  }

  const updated = await ingestionRepository.markProductReviewItemDecision({
    acceptedCatalogProductId,
    declineReason: payload.declineReason ?? null,
    decidedAt: new Date().toISOString(),
    id: payload.id,
    note: payload.note ?? null,
    reviewerId: user.email,
    reviewerName: user.email,
    status
  });
  if (!updated) {
    return json(404, {
      error: "review_item_not_found"
    });
  }

  return json(200, {
    id: payload.id,
    acceptedCatalogProductId,
    status
  });
}

function toReviewItemResponse(item: IngestionProductReviewItemRecord): Record<string, unknown> {
  return {
    acceptedCatalogProductDeletedAt: item.acceptedCatalogProductDeletedAt ?? null,
    acceptedCatalogProductId: item.acceptedCatalogProductId ?? null,
    candidate: item.candidate,
    candidateBuilderName: item.candidateBuilderName,
    candidateBuilderVersion: item.candidateBuilderVersion,
    candidateMatch: item.candidateMatch,
    capturedAt: item.capturedAt,
    createdAt: item.createdAt,
    decision: item.decision ?? null,
    id: item.id,
    rawRowPreview: item.rawRowPreview,
    rowFingerprint: item.rowFingerprint,
    rowIndex: item.rowIndex,
    snapshotId: item.snapshotId,
    sourceName: item.sourceName,
    sourceRecordId: item.sourceRecordId,
    status: item.status,
    updatedAt: item.updatedAt
  };
}

function parseSnapshotId(bodyText: string | undefined): string | null {
  if (!bodyText) {
    return null;
  }

  let payload: { snapshotId?: unknown };
  try {
    payload = JSON.parse(bodyText) as { snapshotId?: unknown };
  } catch (error) {
    if (error instanceof SyntaxError) {
      return null;
    }
    throw error;
  }

  return typeof payload.snapshotId === "string" && payload.snapshotId.trim()
    ? payload.snapshotId.trim()
    : null;
}

function parseOptionalQueryString(value: string | string[] | undefined): string | undefined {
  const candidate = Array.isArray(value) ? value[0] : value;
  return candidate?.trim() || undefined;
}

function parseBooleanQueryValue(value: string | string[] | undefined): boolean {
  return parseOptionalQueryString(value) === "true";
}

function parsePositiveIntegerQueryValue(value: string | string[] | undefined, fallback: number): number {
  const candidate = Number(parseOptionalQueryString(value));
  if (!Number.isInteger(candidate) || candidate < 0) {
    return fallback;
  }

  return candidate;
}

function parseReviewStatuses(value: string | string[] | undefined): IngestionProductReviewItemRecord["status"][] | undefined {
  const rawValue = parseOptionalQueryString(value);
  if (!rawValue) {
    return undefined;
  }

  const statuses = rawValue
    .split(",")
    .map((status) => status.trim())
    .filter((status): status is IngestionProductReviewItemRecord["status"] =>
      ["accepted", "declined", "failed", "pending", "stale"].includes(status)
    );

  return statuses.length ? statuses : undefined;
}

function parseJsonObject(bodyText: string | undefined): Record<string, unknown> | null {
  if (!bodyText) {
    return null;
  }

  try {
    const payload = JSON.parse(bodyText) as unknown;
    return payload && typeof payload === "object" && !Array.isArray(payload)
      ? payload as Record<string, unknown>
      : null;
  } catch (error) {
    if (error instanceof SyntaxError) {
      return null;
    }
    throw error;
  }
}

function parseReviewItemUpdatePayload(bodyText: string | undefined): {
  candidate: ProductReviewCandidateDraft;
  id: string;
} | null {
  const payload = parseJsonObject(bodyText);
  if (!payload) {
    return null;
  }

  const candidate = payload["candidate"];
  if (typeof payload["id"] !== "string" || !isProductReviewCandidateDraft(candidate)) {
    return null;
  }

  return {
    candidate,
    id: payload["id"].trim()
  };
}

function parseReviewDecisionPayload(bodyText: string | undefined, status: "accepted" | "declined"): {
  acceptedCatalogProductId?: string | null;
  declineReason?: ProductReviewDecisionReason | null;
  id: string;
  note?: string | null;
} | null {
  const payload = parseJsonObject(bodyText);
  if (!payload || typeof payload["id"] !== "string" || !payload["id"].trim()) {
    return null;
  }

  const declineReason = typeof payload["declineReason"] === "string"
    && productReviewDecisionReasons.includes(payload["declineReason"] as ProductReviewDecisionReason)
      ? payload["declineReason"] as ProductReviewDecisionReason
      : null;
  if (status === "declined" && !declineReason) {
    return null;
  }

  return {
    acceptedCatalogProductId: typeof payload["acceptedCatalogProductId"] === "string"
      ? payload["acceptedCatalogProductId"].trim() || null
      : null,
    declineReason,
    id: payload["id"].trim(),
    note: typeof payload["note"] === "string" ? payload["note"] : null
  };
}

function isProductReviewCandidateDraft(value: unknown): value is ProductReviewCandidateDraft {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const candidate = value as ProductReviewCandidateDraft;
  return productReviewCandidateMatchConfidences.includes(candidate.matchConfidence)
    && Boolean(candidate.product)
    && typeof candidate.product?.name === "string"
    && Boolean(candidate.source)
    && typeof candidate.source?.sourceName === "string"
    && Array.isArray(candidate.priceObservations)
    && Array.isArray(candidate.sourceProductIdentifiers);
}
