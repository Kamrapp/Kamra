import type { Db } from "mongodb";

import type { AuthenticatedUser, UserRepository } from "../auth/user-auth.js";
import { verifyUserToken } from "../auth/user-token.js";
import {
  MongoCurrentCatalogRepository,
  type CatalogValidatorUpgradeResult,
  type CreateCatalogProductFromReviewCandidateResult,
  type DeleteCatalogProductResult,
  type MarkLegacyProductsUnvalidatedResult,
  type PreviewCatalogProductFromReviewCandidateResult
} from "../catalog/current/mongo-catalog-repository.js";
import type {
  CatalogProductListItem,
  CatalogV1SeedDataset,
  ProductMeasurement,
  SourceRecordProcessingStateRecord
} from "../catalog/v1/contracts.js";
import { readAppConfig, type AppConfig } from "../config/app-config.js";
import { getMongoClient } from "../db/mongo-client.js";
import { MongoHouseholdRepository } from "../household/current/mongo-household-repository.js";
import { MongoIngestionRepository } from "../ingestion/current/mongo-ingestion-repository.js";
import type { IngestionRawSnapshotRecord } from "../ingestion/v1/contracts.js";
import type {
  IngestionProductReviewItemRecord,
  ProductReviewCandidateDraft
} from "../ingestion/v1/review-contracts.js";
import type { ProductReviewDecisionReason } from "../ingestion/v1/review-contracts.js";

export interface AppRequest {
  bodyText?: string;
  headers: Record<string, string | string[] | undefined>;
  method: string;
  path: string;
  query?: Record<string, string | string[] | undefined>;
}

export interface AppResponse {
  body: string;
  headers: Record<string, string>;
  status: number;
}

export interface RequestLogDetails {
  requestMethod: string;
  requestOrigin?: string;
  requestPath: string;
  requestReferer?: string;
  requestUrl: string;
}

export interface AppHandlerDependencies {
  createCatalogRepository?: (database: Db) => {
    findProcessingState?(input: {
      processorName: string;
      processorVersion: string;
      recordFingerprint: string;
      sourceName: string;
    }): Promise<SourceRecordProcessingStateRecord | null>;
    markLegacyProductsUnvalidated?(): Promise<MarkLegacyProductsUnvalidatedResult>;
    deleteCatalogProduct?(id: string): Promise<DeleteCatalogProductResult>;
    createCatalogProductFromReviewCandidate?(input: {
      candidate: {
        origin: {
          capturedAt: string;
          sourceName: string;
          sourceRecordId: string;
          sourceUrl?: string | null;
        };
        priceObservations: Array<{
          currencyCode: string;
          observedAt: string;
          price: number;
          priceKind?: string | null;
          programName?: string | null;
          unitPriceLabel?: string | null;
          validFrom?: string | null;
          validTo?: string | null;
        }>;
        product: {
          brandName?: string | null;
          kind: "grocery" | "household_supply";
          measurements: Array<{
            normalizedUnit?: string | null;
            normalizedValue?: number | null;
            unit: string;
            value: number;
          }>;
          name: string;
          normalizedName: string;
          primaryCategoryKey?: string | null;
        };
        source: {
          countryCode: string;
          currentCategoryLabel?: string | null;
          productPageUrl?: string | null;
          sourceName: string;
          sourceProductKey: string;
          sourceProductName: string;
          storeBrandKey: string;
        };
        sourceProductIdentifiers: Array<{
          kind: string;
          value: string;
        }>;
        stock?: {
          availability: "infinite";
          countryCode: string;
        } | null;
      };
      createdAt: string;
      reviewerId: string;
    }): Promise<CreateCatalogProductFromReviewCandidateResult>;
    previewCatalogProductFromReviewCandidate?(input: {
      candidate: ProductReviewCandidateDraft;
    }): Promise<PreviewCatalogProductFromReviewCandidateResult>;
    findCatalogProductForReview?(id: string): Promise<CatalogProductListItem | null>;
    listCatalogProductsForReview(options?: { limit?: number; nameIncludes?: string; offset?: number; sourceNames?: string[] }): Promise<{
      products: unknown[];
      totalCount: number;
    }>;
    listCatalogOfferSourceNames?(): Promise<string[]>;
    setCatalogProductValidationStatus?(input: {
      id: string;
      note?: string | null;
      reviewedAt: string;
      reviewerId: string;
      status: "invalid" | "validated";
    }): Promise<CatalogProductListItem | null>;
    setupCollections?(): Promise<unknown>;
    updateCatalogProduct?(input: {
      brandName?: string | null;
      id: string;
      measurements?: ProductMeasurement[];
      name?: string;
      primaryCategoryKey?: string | null;
      updatedAt: string;
      validationNote?: string | null;
    }): Promise<CatalogProductListItem | null>;
    upgradeCatalogValidators?(): Promise<CatalogValidatorUpgradeResult>;
    upsertCatalogSeedDataset?(dataset: CatalogV1SeedDataset): Promise<void>;
  };
  createHouseholdRepository?: (database: Db) => MongoHouseholdRepository;
  createIngestionRepository?: (database: Db) => {
    findRawSnapshotById(id: string): Promise<IngestionRawSnapshotRecord | null>;
    findProductReviewItemById?(id: string): Promise<IngestionProductReviewItemRecord | null>;
    listRawSnapshots(options?: { limit?: number; offset?: number; sourceNames?: string[]; sourceName?: string }): Promise<IngestionRawSnapshotRecord[]>;
    listRawSnapshotSourceNames?(): Promise<string[]>;
    listProductReviewItems?(options?: {
      limit?: number;
      offset?: number;
      snapshotId?: string;
      sourceName?: string;
      status?: IngestionProductReviewItemRecord["status"][];
    }): Promise<IngestionProductReviewItemRecord[]>;
    markProductReviewItemDecision?(input: {
      acceptedCatalogProductDeletedAt?: string | null;
      acceptedCatalogProductId?: string | null;
      declineReason?: ProductReviewDecisionReason | null;
      id: string;
      note?: string | null;
      decidedAt: string;
      reviewerId: string;
      reviewerName: string;
      status: "accepted" | "declined";
    }): Promise<boolean>;
    prepareProductReviewItems?(snapshot: IngestionRawSnapshotRecord): Promise<IngestionProductReviewItemRecord[]>;
    setupCollections?(): Promise<unknown>;
    updateProductReviewItemCandidate?(input: {
      candidate: ProductReviewCandidateDraft;
      id: string;
      updatedAt: string;
    }): Promise<boolean>;
  };
  createUserRepository?: (database: Db) => UserRepository;
  getMongoClient?: typeof getMongoClient;
}

export interface AppRouteContext {
  authenticateRequestUser(request: AppRequest): AuthenticatedUser | null;
  config: AppConfig;
  dependencies: AppHandlerDependencies;
  getMongoClient: typeof getMongoClient;
}

export interface AppRoute {
  handle(request: AppRequest, context: AppRouteContext): Promise<AppResponse>;
  match(request: AppRequest): boolean;
}

export function createRouteContext(dependencies: AppHandlerDependencies = {}): AppRouteContext {
  const config = readAppConfig();

  return {
    authenticateRequestUser: (request) => authenticateRequestUser(request, config),
    config,
    dependencies,
    getMongoClient: dependencies.getMongoClient ?? getMongoClient
  };
}

export function json(status: number, payload: unknown): AppResponse {
  return {
    body: JSON.stringify(payload),
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store"
    },
    status
  };
}

export function empty(status: number): AppResponse {
  return {
    body: "",
    headers: {
      "cache-control": "no-store"
    },
    status
  };
}

export function unauthorized(message = "Sign in to view this resource."): AppResponse {
  return json(401, {
    error: "unauthorized",
    message
  });
}

export function describeRequest(request: AppRequest): RequestLogDetails {
  const requestOrigin = getHeader(request.headers, "origin");
  const requestReferer = getHeader(request.headers, "referer");
  const requestUrl = inferRequestUrl(request, requestOrigin ?? requestReferer);

  return {
    requestMethod: request.method,
    requestOrigin: requestOrigin ?? undefined,
    requestPath: request.path,
    requestReferer: requestReferer ?? undefined,
    requestUrl
  };
}

function getHeader(headers: AppRequest["headers"], name: string): string | null {
  const expectedName = name.toLowerCase();

  for (const [headerName, headerValue] of Object.entries(headers)) {
    if (headerName.toLowerCase() !== expectedName) {
      continue;
    }

    return Array.isArray(headerValue)
      ? headerValue[0] ?? null
      : headerValue ?? null;
  }

  return null;
}

function inferRequestUrl(request: AppRequest, fallbackUrl: string | null): string {
  const forwardedProto = getHeader(request.headers, "x-forwarded-proto");
  const forwardedHost = getHeader(request.headers, "x-forwarded-host");
  const host = forwardedHost ?? getHeader(request.headers, "host");
  const queryString = toQueryString(request.query);

  if (host) {
    const protocol = forwardedProto && forwardedProto.length > 0
      ? forwardedProto.split(",")[0]!.trim()
      : "https";

    return `${protocol}://${host}${request.path}${queryString}`;
  }

  if (fallbackUrl) {
    try {
      const fallback = new URL(fallbackUrl);
      return `${fallback.protocol}//${fallback.host}${request.path}${queryString}`;
    } catch {
      return `${request.path}${queryString}`;
    }
  }

  return `${request.path}${queryString}`;
}

function toQueryString(query: AppRequest["query"]): string {
  if (!query) {
    return "";
  }

  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        searchParams.append(key, item);
      }
      continue;
    }

    if (typeof value === "string") {
      searchParams.append(key, value);
    }
  }

  const serialized = searchParams.toString();
  return serialized.length > 0
    ? `?${serialized}`
    : "";
}

function getBearerToken(request: AppRequest): string | null {
  const authorization = getHeader(request.headers, "authorization");
  if (!authorization) {
    return null;
  }

  const [scheme, token] = authorization.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return null;
  }

  return token;
}

function authenticateRequestUser(
  request: AppRequest,
  config: AppConfig
): AuthenticatedUser | null {
  if (!config.auth.tokenSecret) {
    return null;
  }

  const token = getBearerToken(request);
  if (!token) {
    return null;
  }

  const result = verifyUserToken(token, config.auth.tokenSecret);
  if (result.status !== "valid") {
    return null;
  }

  return {
    email: result.payload.email,
    profile: {},
    role: result.payload.role
  };
}

export function createDefaultCatalogRepository(database: Db): MongoCurrentCatalogRepository {
  return new MongoCurrentCatalogRepository(database);
}

export function createDefaultHouseholdRepository(database: Db): MongoHouseholdRepository {
  return new MongoHouseholdRepository(database);
}

export function createDefaultIngestionRepository(database: Db): MongoIngestionRepository {
  return new MongoIngestionRepository(database);
}
