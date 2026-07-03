import type { Db } from "mongodb";

import type { MongoUserRepository } from "../auth/mongo-user-repository.js";
import type { AuthenticatedUser } from "../auth/user-auth.js";
import { verifyUserToken } from "../auth/user-token.js";
import { MongoCurrentCatalogRepository } from "../catalog/current/mongo-catalog-repository.js";
import type { CatalogV1SeedDataset, SourceRecordProcessingStateRecord } from "../catalog/v1/contracts.js";
import { readAppConfig, type AppConfig } from "../config/app-config.js";
import { getMongoClient } from "../db/mongo-client.js";
import { MongoIngestionRepository } from "../ingestion/current/mongo-ingestion-repository.js";
import type { IngestionRawSnapshotRecord } from "../ingestion/v1/contracts.js";

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

export interface AppHandlerDependencies {
  createCatalogRepository?: (database: Db) => {
    findProcessingState?(input: {
      processorName: string;
      processorVersion: string;
      recordFingerprint: string;
      sourceName: string;
    }): Promise<SourceRecordProcessingStateRecord | null>;
    listCatalogProductsForReview(options?: { limit?: number; offset?: number; sourceNames?: string[] }): Promise<{
      products: unknown[];
      totalCount: number;
    }>;
    listCatalogOfferSourceNames?(): Promise<string[]>;
    setupCollections?(): Promise<unknown>;
    upsertCatalogSeedDataset?(dataset: CatalogV1SeedDataset): Promise<void>;
  };
  createIngestionRepository?: (database: Db) => {
    findRawSnapshotById(id: string): Promise<IngestionRawSnapshotRecord | null>;
    listRawSnapshots(options?: { limit?: number; sourceName?: string }): Promise<IngestionRawSnapshotRecord[]>;
    setupCollections?(): Promise<unknown>;
  };
  createUserRepository?: (database: Db) => MongoUserRepository;
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
    role: result.payload.role
  };
}

export function createDefaultCatalogRepository(database: Db): MongoCurrentCatalogRepository {
  return new MongoCurrentCatalogRepository(database);
}

export function createDefaultIngestionRepository(database: Db): MongoIngestionRepository {
  return new MongoIngestionRepository(database);
}
