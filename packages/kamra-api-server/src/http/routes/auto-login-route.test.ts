import { afterEach, describe, expect, it, vi } from "vitest";

import { hashPassword } from "../../auth/password-hash.js";
import type { UserDocument, UserRepository } from "../../auth/user-auth.js";
import { createUserToken } from "../../auth/user-token.js";
import { createFakeDb, FakeCollection } from "../../test-support/fake-mongo.js";
import { handleAppRequest } from "../app-handler.js";

const configuredUserName = "usera";
const configuredPassword = "auto-login-password";

function createUserRepository(onLookup?: () => void): Promise<UserRepository> {
  return hashPassword(configuredPassword).then((passwordHash) => {
    const user: UserDocument = {
      authProvider: "bootstrap_credentials",
      email: configuredUserName,
      passwordHash,
      profile: {},
      role: "user",
      status: "active"
    };

    return {
      createAlphaUser: async () => {
        throw new Error("not used");
      },
      findActiveUserByEmail: async (email) => {
        onLookup?.();
        return email === user.email ? user : null;
      },
      findUserByEmail: async (email) => (email === user.email ? user : null),
      updateUserProfile: async () => null
    };
  });
}

function createFeatureFlagDb(enabled: boolean) {
  return createFakeDb({
    household_feature_flags: new FakeCollection<Record<string, unknown>>(
      "household_feature_flags",
      [
        {
          enabled,
          key: "allowAutomaticLogin",
          revision: 1,
          updatedAt: "2026-07-19T12:00:00.000Z",
          updatedByUserId: "admin@kamra.test"
        }
      ]
    )
  });
}

function configureRuntime(): void {
  vi.stubEnv("AUTH_TOKEN_SECRET", "test-secret");
  vi.stubEnv("MONGODB_URI", "mongodb+srv://example.mongodb.net/kamra");
  vi.stubEnv("MONGODB_DB_NAME", "kamra_test");
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("automatic login route", () => {
  it("returns a normal user token when the flag and both credentials are configured", async () => {
    configureRuntime();
    vi.stubEnv("AUTO_LOGIN_USER_NAME", configuredUserName);
    vi.stubEnv("AUTO_LOGIN_PASSWORD", configuredPassword);
    const db = createFeatureFlagDb(true);
    const userRepository = await createUserRepository();

    const response = await handleAppRequest(
      {
        headers: {},
        method: "POST",
        path: "/api/auto-login"
      },
      {
        createUserRepository: () => userRepository,
        getMongoClient: async () => ({ db: () => db }) as never
      }
    );

    expect(response.status).toBe(200);
    expect(JSON.parse(response.body)).toMatchObject({
      tokenType: "Bearer",
      user: {
        email: configuredUserName,
        profile: {},
        role: "user"
      }
    });
    expect(JSON.parse(response.body).token).toEqual(expect.any(String));
  });

  it("does not replace an existing authenticated session", async () => {
    configureRuntime();
    vi.stubEnv("AUTO_LOGIN_USER_NAME", configuredUserName);
    vi.stubEnv("AUTO_LOGIN_PASSWORD", configuredPassword);
    const db = createFeatureFlagDb(true);
    let lookupCount = 0;
    const userRepository = await createUserRepository(() => {
      lookupCount += 1;
    });
    const existingToken = createUserToken({
      email: "other-user",
      maxAgeSeconds: 60,
      now: new Date(),
      role: "user",
      secret: "test-secret"
    });

    const response = await handleAppRequest(
      {
        headers: { authorization: `Bearer ${existingToken}` },
        method: "POST",
        path: "/api/auto-login"
      },
      {
        createUserRepository: () => userRepository,
        getMongoClient: async () => ({ db: () => db }) as never
      }
    );

    expect(response.status).toBe(204);
    expect(lookupCount).toBe(0);
  });

  it("does nothing when either credential is missing", async () => {
    configureRuntime();
    vi.stubEnv("AUTO_LOGIN_USER_NAME", configuredUserName);
    const db = createFeatureFlagDb(true);
    let lookupCount = 0;
    const userRepository = await createUserRepository(() => {
      lookupCount += 1;
    });

    const response = await handleAppRequest(
      {
        headers: {},
        method: "POST",
        path: "/api/auto-login"
      },
      {
        createUserRepository: () => userRepository,
        getMongoClient: async () => ({ db: () => db }) as never
      }
    );

    expect(response.status).toBe(204);
    expect(lookupCount).toBe(0);
  });

  it("does nothing when automatic login is disabled", async () => {
    configureRuntime();
    vi.stubEnv("AUTO_LOGIN_USER_NAME", configuredUserName);
    vi.stubEnv("AUTO_LOGIN_PASSWORD", configuredPassword);
    const db = createFeatureFlagDb(false);
    let lookupCount = 0;
    const userRepository = await createUserRepository(() => {
      lookupCount += 1;
    });

    const response = await handleAppRequest(
      {
        headers: {},
        method: "POST",
        path: "/api/auto-login"
      },
      {
        createUserRepository: () => userRepository,
        getMongoClient: async () => ({ db: () => db }) as never
      }
    );

    expect(response.status).toBe(204);
    expect(lookupCount).toBe(0);
  });
});
