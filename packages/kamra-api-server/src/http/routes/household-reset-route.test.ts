import { describe, expect, it } from "vitest";

import type { AuthenticatedUser } from "../../auth/user-auth.js";
import type { AppConfig } from "../../config/app-config.js";
import type { AppRequest, AppRouteContext } from "../app-route-context.js";
import { createFakeDb, FakeCollection } from "../../test-support/fake-mongo.js";
import { householdResetRoute } from "./household-routes.js";

describe("household reset route", () => {
  it("allows only the household owner to reset selected content", async () => {
    const database = createFakeDb({
      households: new FakeCollection("households", [{ id: "household1", name: "Demo household" }]),
      household_memberships: new FakeCollection("household_memberships", [
        { householdId: "household1", role: "owner", status: "active", userId: "owner" }
      ]),
      household_products: new FakeCollection("household_products", [
        { householdId: "household1", id: "product1" }
      ])
    });
    const request: AppRequest = {
      bodyText: JSON.stringify({ scope: "products_and_batches" }),
      headers: {},
      method: "POST",
      path: "/api/households/household1/reset"
    };

    const denied = await householdResetRoute.handle(
      request,
      createContext(database, { email: "member", role: "user" })
    );
    expect(denied.status).toBe(403);
    expect(database.__collections["household_products"]!.docs).toHaveLength(1);

    const allowed = await householdResetRoute.handle(
      request,
      createContext(database, { email: "owner", role: "user" })
    );
    expect(allowed.status).toBe(200);
    expect(JSON.parse(allowed.body)).toMatchObject({
      scope: "products_and_batches",
      deleted: { household_products: 1 }
    });
    expect(database.__collections["household_products"]!.docs).toHaveLength(0);

    const deleteHousehold = await householdResetRoute.handle(
      {
        ...request,
        bodyText: JSON.stringify({ scope: "delete_household" })
      },
      createContext(database, { email: "owner", role: "user" })
    );
    expect(deleteHousehold.status).toBe(200);
    expect(database.__collections["households"]!.docs).toHaveLength(0);
  });
});

function createContext(
  database: ReturnType<typeof createFakeDb>,
  user: Partial<AuthenticatedUser>
) {
  return {
    authenticateRequestUser: () => ({
      email: user.email ?? "user@example.test",
      profile: {},
      role: user.role ?? "user"
    }),
    config: {
      mongodb: {
        databaseName: "kamra_test",
        dnsServers: [],
        uri: "mongodb://example.test"
      }
    } as unknown as AppConfig,
    dependencies: {},
    getMongoClient: async () => ({
      db: () => database,
      startSession: () => ({
        abortTransaction: async () => undefined,
        commitTransaction: async () => undefined,
        endSession: async () => undefined,
        startTransaction: () => undefined
      })
    })
  } as unknown as AppRouteContext;
}
