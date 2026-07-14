import { beforeEach, describe, expect, it, vi } from "vitest";

import type { UserDocument, UserRepository } from "../auth/user-auth.js";
import { createUserToken } from "../auth/user-token.js";
import { MongoHouseholdRepository } from "../household/current/mongo-household-repository.js";
import { handleAppRequest } from "./app-handler.js";
import type { AppHandlerDependencies } from "./app-route-context.js";
import { createFakeDb } from "../test-support/fake-mongo.js";

describe("household invitation routes", () => {
  beforeEach(() => {
    vi.stubEnv("AUTH_TOKEN_SECRET", "invitation-route-secret");
    vi.stubEnv("MONGODB_URI", "mongodb://example.test/kamra");
    vi.stubEnv("MONGODB_DB_NAME", "kamra_test");
  });

  it("supports owner invitations, existing-user acceptance, and invited registration", async () => {
    const database = createFakeDb();
    const householdRepository = new MongoHouseholdRepository(database);
    await householdRepository.setupCollections();
    await householdRepository.createHousehold({
      createdAt: "2026-07-13T10:00:00.000Z",
      createdByUserId: "owner@example.test",
      id: "household-1",
      name: "Shared home"
    });

    const users = new Map<string, UserDocument>();
    const userRepository: UserRepository = {
      createAlphaUser: async (input) => {
        const user = createUserDocument(input.email, input.passwordHash, input.role, input.status);
        users.set(user.email, user);
        return user;
      },
      createRegisteredUser: async (input) => {
        const user = createUserDocument(input.email, input.passwordHash, input.role, input.status);
        users.set(user.email, user);
        return user;
      },
      findActiveUserByEmail: async (email) => {
        const user = users.get(email);
        return user?.status === "active" ? user : null;
      },
      findUserByEmail: async (email) => users.get(email) ?? null,
      updateUserProfile: async () => null
    };
    const dependencies: AppHandlerDependencies = {
      createHouseholdRepository: () => householdRepository,
      createUserRepository: () => userRepository,
      getMongoClient: async () => ({ db: () => database }) as never
    };
    const ownerToken = tokenFor("owner@example.test", "user");
    const memberToken = tokenFor("member@example.test", "user");

    const invited = await request(
      {
        bodyText: JSON.stringify({ email: "member@example.test" }),
        headers: { authorization: `Bearer ${ownerToken}` },
        method: "POST",
        path: "/api/households/household-1/invitations"
      },
      dependencies
    );
    expect(invited.status).toBe(201);

    const invitationId = (JSON.parse(invited.body) as { invitation: { id: string } }).invitation.id;
    const pending = await request(
      {
        headers: { authorization: `Bearer ${memberToken}` },
        method: "GET",
        path: "/api/invitations"
      },
      dependencies
    );
    expect(pending.status).toBe(200);
    expect(JSON.parse(pending.body)).toMatchObject({
      invitations: [{ email: "member@example.test", householdName: "Shared home" }]
    });

    const accepted = await request(
      {
        bodyText: "{}",
        headers: { authorization: `Bearer ${memberToken}` },
        method: "POST",
        path: `/api/invitations/${encodeURIComponent(invitationId)}/accept`
      },
      dependencies
    );
    expect(accepted.status).toBe(200);
    await expect(
      householdRepository.listHouseholdsForUser("member@example.test")
    ).resolves.toHaveLength(1);

    const newcomerInvitation = await request(
      {
        bodyText: JSON.stringify({ email: "newcomer@example.test" }),
        headers: { authorization: `Bearer ${ownerToken}` },
        method: "POST",
        path: "/api/households/household-1/invitations"
      },
      dependencies
    );
    expect(newcomerInvitation.status).toBe(201);

    const registered = await request(
      {
        bodyText: JSON.stringify({ email: "newcomer@example.test", password: "correct-password" }),
        headers: {},
        method: "POST",
        path: "/api/register"
      },
      dependencies
    );
    expect(registered.status).toBe(201);
    expect(JSON.parse(registered.body)).toMatchObject({
      tokenType: "Bearer",
      user: { email: "newcomer@example.test", role: "user" }
    });
    await expect(
      householdRepository.listHouseholdsForUser("newcomer@example.test")
    ).resolves.toHaveLength(1);

    const members = await request(
      {
        headers: { authorization: `Bearer ${ownerToken}` },
        method: "GET",
        path: "/api/households/household-1/members"
      },
      dependencies
    );
    expect(members.status).toBe(200);
    expect(JSON.parse(members.body)).toMatchObject({
      members: [
        { role: "owner", userId: "owner@example.test" },
        { role: "member", userId: "member@example.test" },
        { role: "member", userId: "newcomer@example.test" }
      ]
    });

    const cancellable = await request(
      {
        bodyText: JSON.stringify({ email: "cancel@example.test" }),
        headers: { authorization: `Bearer ${ownerToken}` },
        method: "POST",
        path: "/api/households/household-1/invitations"
      },
      dependencies
    );
    const cancellableId = (JSON.parse(cancellable.body) as { invitation: { id: string } })
      .invitation.id;
    const cancelled = await request(
      {
        headers: { authorization: `Bearer ${ownerToken}` },
        method: "DELETE",
        path: `/api/households/household-1/invitations/${encodeURIComponent(cancellableId)}`
      },
      dependencies
    );
    expect(cancelled.status).toBe(200);

    const rejectable = await request(
      {
        bodyText: JSON.stringify({ email: "reject@example.test" }),
        headers: { authorization: `Bearer ${ownerToken}` },
        method: "POST",
        path: "/api/households/household-1/invitations"
      },
      dependencies
    );
    const rejectableId = (JSON.parse(rejectable.body) as { invitation: { id: string } }).invitation
      .id;
    const rejected = await request(
      {
        headers: { authorization: `Bearer ${tokenFor("reject@example.test", "user")}` },
        method: "POST",
        path: `/api/invitations/${encodeURIComponent(rejectableId)}/reject`
      },
      dependencies
    );
    expect(rejected.status).toBe(200);
  });
});

async function request(
  request: Parameters<typeof handleAppRequest>[0],
  dependencies: AppHandlerDependencies
) {
  return await handleAppRequest(request, dependencies);
}

function tokenFor(email: string, role: "admin" | "user"): string {
  return createUserToken({
    email,
    maxAgeSeconds: 60 * 60,
    now: new Date(),
    role,
    secret: "invitation-route-secret"
  });
}

function createUserDocument(
  email: string,
  passwordHash: UserDocument["passwordHash"],
  role: UserDocument["role"],
  status: UserDocument["status"]
): UserDocument {
  return {
    authProvider: "bootstrap_credentials",
    email,
    passwordHash,
    role,
    status
  };
}
