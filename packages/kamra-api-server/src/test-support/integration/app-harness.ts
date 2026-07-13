import { createUserToken } from "../../auth/user-token.js";
import { MongoHouseholdRepository } from "../../household/current/mongo-household-repository.js";
import type {
  AppHandlerDependencies,
  AppRequest,
  AppResponse
} from "../../http/app-route-context.js";
import { handleAppRequest } from "../../http/app-handler.js";
import { createFakeDb, type FakeCollection } from "../fake-mongo.js";

export interface IntegrationUserFixture {
  email: string;
  role: "admin" | "user";
}

export interface IntegrationHarnessOptions {
  collections?: Record<string, FakeCollection<Record<string, unknown>>>;
  databaseName?: string;
  householdId?: string;
  now?: Date;
  secret?: string;
  user: IntegrationUserFixture;
}

export interface IntegrationHarnessRequest extends Omit<AppRequest, "headers"> {
  headers?: AppRequest["headers"];
}

export interface IntegrationHarness {
  readonly database: ReturnType<typeof createFakeDb>;
  readonly dependencies: AppHandlerDependencies;
  readonly householdId: string;
  readonly secret: string;
  readonly token: string;
  readonly user: IntegrationUserFixture;
  request(input: IntegrationHarnessRequest): AppRequest;
  send(input: IntegrationHarnessRequest): Promise<AppResponse>;
}

export function createIntegrationHarness(options: IntegrationHarnessOptions): IntegrationHarness {
  const secret = options.secret ?? "stage11-integration-secret";
  const householdId = options.householdId ?? "stage11-household";
  const now = options.now ?? new Date("2026-07-13T12:00:00.000Z");
  const database = createFakeDb(options.collections, {
    databaseName: options.databaseName ?? "stage11_integration"
  });
  const token = createUserToken({
    email: options.user.email,
    maxAgeSeconds: 300,
    now,
    role: options.user.role,
    secret
  });
  const dependencies: AppHandlerDependencies = {
    createHouseholdRepository: () => new MongoHouseholdRepository(database),
    getMongoClient: async () =>
      ({
        db: () => database
      }) as never
  };

  return {
    database,
    dependencies,
    householdId,
    secret,
    token,
    user: options.user,
    request(input) {
      return {
        ...input,
        headers: {
          authorization: `Bearer ${token}`,
          ...input.headers
        }
      };
    },
    send(input) {
      return handleAppRequest(this.request(input), dependencies);
    }
  };
}
