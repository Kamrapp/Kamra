import { describe, expect, it, vi } from "vitest";

import type { AuthenticatedUser, UserRepository } from "../../auth/user-auth.js";
import type { AppConfig } from "../../config/app-config.js";
import type { AppRequest, AppRouteContext } from "../app-route-context.js";
import {
  adminUserDeleteRoute,
  adminUserListRoute,
  adminUserPasswordRoute
} from "./admin-user-routes.js";

describe("admin user routes", () => {
  it("lists users without exposing password data and resets a password", async () => {
    const updateUserPassword = vi.fn().mockResolvedValue(true);
    const repository: UserRepository = {
      createAlphaUser: vi.fn(),
      findActiveUserByEmail: vi.fn(),
      findUserByEmail: vi.fn(),
      listAdminUsers: vi.fn().mockResolvedValue([
        {
          createdAt: "2026-07-13T10:00:00.000Z",
          email: "user@example.test",
          households: [],
          role: "user",
          status: "active"
        }
      ]),
      updateUserPassword,
      updateUserProfile: vi.fn()
    };
    const context = createContext(repository);

    const listResponse = await adminUserListRoute.handle(
      createRequest("GET", "/api/admin/users"),
      context
    );
    expect(listResponse.status).toBe(200);
    expect(JSON.parse(listResponse.body)).toEqual({
      users: [expect.objectContaining({ email: "user@example.test" })]
    });
    expect(JSON.parse(listResponse.body)).not.toHaveProperty("users.0.passwordHash");

    const passwordResponse = await adminUserPasswordRoute.handle(
      {
        ...createRequest("PATCH", "/api/admin/users/user%40example.test/password"),
        bodyText: JSON.stringify({ password: "new-password" })
      },
      context
    );
    expect(passwordResponse.status).toBe(200);
    expect(updateUserPassword).toHaveBeenCalledWith(
      "user@example.test",
      expect.objectContaining({ algorithm: "scrypt" })
    );
  });

  it("does not allow the current admin to delete their own account", async () => {
    const deleteUser = vi.fn();
    const repository = createRepository({ deleteUser });
    const response = await adminUserDeleteRoute.handle(
      createRequest("DELETE", "/api/admin/users/admin%40example.test"),
      createContext(repository)
    );

    expect(response.status).toBe(409);
    expect(JSON.parse(response.body)).toMatchObject({ error: "cannot_delete_current_admin" });
    expect(deleteUser).not.toHaveBeenCalled();
  });

  it("returns deletion ownership results", async () => {
    const deleteUser = vi.fn().mockResolvedValue({
      deletedHouseholdIds: ["household1"],
      promotedUserIds: ["next@example.test"],
      removedMembershipCount: 1
    });
    const response = await adminUserDeleteRoute.handle(
      createRequest("DELETE", "/api/admin/users/removed%40example.test"),
      createContext(createRepository({ deleteUser }))
    );

    expect(response.status).toBe(200);
    expect(JSON.parse(response.body)).toMatchObject({
      deletedHouseholdIds: ["household1"],
      email: "removed@example.test",
      promotedUserIds: ["next@example.test"]
    });
  });
});

function createRepository(overrides: Partial<UserRepository> = {}): UserRepository {
  return {
    createAlphaUser: vi.fn(),
    findActiveUserByEmail: vi.fn(),
    findUserByEmail: vi.fn(),
    updateUserProfile: vi.fn(),
    ...overrides
  };
}

function createRequest(method: string, path: string): AppRequest {
  return { headers: {}, method, path };
}

function createContext(repository: UserRepository): AppRouteContext {
  const admin: AuthenticatedUser = {
    email: "admin@example.test",
    profile: {},
    role: "admin"
  };
  const database = { db: vi.fn() };
  return {
    authenticateRequestUser: () => admin,
    config: {
      mongodb: {
        databaseName: "kamra_test",
        dnsServers: [],
        uri: "mongodb://example.test"
      }
    } as unknown as AppConfig,
    dependencies: {
      createUserRepository: () => repository
    },
    getMongoClient: vi.fn().mockResolvedValue(database)
  };
}
