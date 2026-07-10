import {
  authenticateUser,
  isUserLanguagePreference,
  isUserThemePreference,
  toAuthenticatedUser,
  type UserProfile,
  type UserRepository
} from "../../auth/user-auth.js";
import { MongoUserRepository } from "../../auth/mongo-user-repository.js";
import { hashPassword } from "../../auth/password-hash.js";
import { createUserToken } from "../../auth/user-token.js";
import { createDefaultHouseholdRepository } from "../app-route-context.js";
import { writeServerLog } from "../../logging/kamra-logger.js";
import { describeRequest, empty, json, unauthorized, type AppRequest, type AppRoute } from "../app-route-context.js";

function readLoginPayload(bodyText: string | undefined):
  | { email: string; password: string }
  | null {
  try {
    const payload = JSON.parse(bodyText ?? "{}") as {
      email?: unknown;
      password?: unknown;
      username?: unknown;
    };
    const email = typeof payload.email === "string"
      ? payload.email
      : typeof payload.username === "string"
        ? payload.username
        : null;

    if (!email || typeof payload.password !== "string") {
      return null;
    }

    return {
      email,
      password: payload.password
    };
  } catch {
    return null;
  }
}

function readProfilePayload(bodyText: string | undefined): UserProfile | null {
  try {
    const payload = JSON.parse(bodyText ?? "{}") as {
      language?: unknown;
      theme?: unknown;
    };

    const profile: UserProfile = {};

    if (payload.language !== undefined) {
      if (!isUserLanguagePreference(payload.language)) {
        return null;
      }

      profile.language = payload.language;
    }

    if (payload.theme !== undefined) {
      if (!isUserThemePreference(payload.theme)) {
        return null;
      }

      profile.theme = payload.theme;
    }

    if (profile.language === undefined && profile.theme === undefined) {
      return null;
    }

    return profile;
  } catch {
    return null;
  }
}

function readAlphaUserPayload(bodyText: string | undefined): { email: string; password: string } | null {
  try {
    const payload = JSON.parse(bodyText ?? "{}") as {
      email?: unknown;
      password?: unknown;
    };
    if (typeof payload.email !== "string" || typeof payload.password !== "string") {
      return null;
    }

    const email = payload.email.trim().toLowerCase();
    return email && payload.password.length >= 8
      ? { email, password: payload.password }
      : null;
  } catch {
    return null;
  }
}

async function createUserRepository(
  context: Parameters<AppRoute["handle"]>[1]
): Promise<UserRepository | null> {
  const config = context.config;
  if (!config.mongodb.uri || !config.mongodb.databaseName) {
    return null;
  }

  const client = await context.getMongoClient(
    config.mongodb.uri,
    config.mongodb.dnsServers
  );

  return context.dependencies.createUserRepository
    ? context.dependencies.createUserRepository(client.db(config.mongodb.databaseName))
    : new MongoUserRepository(client.db(config.mongodb.databaseName));
}

async function createHouseholdRepository(
  context: Parameters<AppRoute["handle"]>[1]
): Promise<ReturnType<typeof createDefaultHouseholdRepository> | null> {
  const config = context.config;
  if (!config.mongodb.uri || !config.mongodb.databaseName) {
    return null;
  }

  const client = await context.getMongoClient(
    config.mongodb.uri,
    config.mongodb.dnsServers
  );
  const database = client.db(config.mongodb.databaseName);

  return context.dependencies.createHouseholdRepository
    ? context.dependencies.createHouseholdRepository(database)
    : createDefaultHouseholdRepository(database);
}

export const loginRoute: AppRoute = {
  match: (request: AppRequest) => request.method === "POST" && request.path === "/api/login",
  handle: async (request, context) => {
    const payload = readLoginPayload(request.bodyText);

    if (!payload) {
      return json(400, { error: "invalid_login_payload" });
    }

    const config = context.config;
    if (!config.auth.tokenSecret || !config.mongodb.uri || !config.mongodb.databaseName) {
      return json(503, { error: "auth_not_configured" });
    }

    const repository = await createUserRepository(context);
    if (!repository) {
      return json(503, { error: "auth_not_configured" });
    }

    const householdRepository = await createHouseholdRepository(context);
    const alphaAccessEnabled = householdRepository
      ? (await householdRepository.readFeatureFlag("allowControlledAlphaAccess", false)).enabled
      : true;
    const result = await authenticateUser(payload.email, payload.password, repository, {
      alphaAccessEnabled
    });

    if (result.status !== "authenticated") {
      return json(401, { error: "invalid_credentials" });
    }

    const token = createUserToken({
      email: result.user.email,
      maxAgeSeconds: config.auth.tokenMaxAgeSeconds,
      role: result.user.role,
      secret: config.auth.tokenSecret
    });

    writeServerLog("info", "User login completed", {
      role: result.user.role,
      ...describeRequest(request),
      username: result.user.email
    });

    return json(200, {
      token,
      tokenType: "Bearer",
      user: result.user
    });
  }
};

export const createAlphaUserRoute: AppRoute = {
  match: (request) => request.method === "POST" && request.path === "/api/admin/alpha-users",
  handle: async (request, context) => {
    const admin = context.authenticateRequestUser(request);
    if (!admin || admin.role !== "admin") {
      return unauthorized("apiErrors.adminRequired");
    }

    const payload = readAlphaUserPayload(request.bodyText);
    if (!payload) {
      return json(400, {
        error: "invalid_alpha_user_payload",
        message: "An email and a password of at least 8 characters are required."
      });
    }

    const userRepository = await createUserRepository(context);
    const householdRepository = await createHouseholdRepository(context);
    if (!userRepository || !householdRepository) {
      return json(503, { error: "alpha_access_not_configured" });
    }

    const alphaAccessEnabled = (await householdRepository.readFeatureFlag(
      "allowControlledAlphaAccess",
      false
    )).enabled;
    if (!alphaAccessEnabled) {
      return json(409, { error: "alpha_access_disabled" });
    }

    const existingUser = await userRepository.findUserByEmail(payload.email);
    if (existingUser) {
      if (!existingUser.alphaAccess) {
        return json(409, { error: "user_already_exists" });
      }

      const existingHouseholds = await householdRepository.listHouseholdsForUser(existingUser.email);
      if (existingHouseholds.length > 0) {
        return json(409, { error: "user_already_exists" });
      }

      const household = await householdRepository.createHousehold({
        createdAt: new Date().toISOString(),
        createdByUserId: existingUser.email,
        id: `household_alpha_${stableSlug(existingUser.email)}_${Date.now().toString(36)}`,
        name: `${existingUser.email} household`
      });

      return json(201, {
        household: household.household,
        user: toAuthenticatedUser(existingUser)
      });
    }

    const now = new Date();
    const createdUser = await userRepository.createAlphaUser({
      alphaAccess: {
        createdAt: now,
        createdByUserId: admin.email
      },
      email: payload.email,
      passwordHash: await hashPassword(payload.password),
      role: "user",
      status: "active"
    });
    const household = await householdRepository.createHousehold({
      createdAt: now.toISOString(),
      createdByUserId: createdUser.email,
      id: `household_alpha_${stableSlug(createdUser.email)}_${Date.now().toString(36)}`,
      name: `${createdUser.email} household`
    });

    writeServerLog("info", "Controlled alpha user created", {
      ...describeRequest(request),
      createdBy: admin.email,
      username: createdUser.email
    });

    return json(201, {
      household: household.household,
      user: toAuthenticatedUser(createdUser)
    });
  }
};

export const logoutRoute: AppRoute = {
  match: (request) => request.method === "POST" && request.path === "/api/logout",
  handle: async () => empty(204)
};

export const currentUserRoute: AppRoute = {
  match: (request) => request.method === "GET" && request.path === "/api/admin/me",
  handle: async (request, context) => {
    const user = context.authenticateRequestUser(request);
    if (!user) {
      return unauthorized("apiErrors.signInRequired");
    }

    const repository = await createUserRepository(context);
    if (!repository) {
      return json(200, { user });
    }

    const profileUser = await repository.findActiveUserByEmail(user.email);

    return json(200, {
      user: profileUser
        ? toAuthenticatedUser(profileUser)
        : user
    });
  }
};

export const userPreferencesRoute: AppRoute = {
  match: (request) => request.method === "PATCH" && request.path === "/api/admin/preferences",
  handle: async (request, context) => {
    const user = context.authenticateRequestUser(request);
    if (!user) {
      return unauthorized("apiErrors.preferencesSignInRequired");
    }

    const profile = readProfilePayload(request.bodyText);
    if (!profile) {
      return json(400, { error: "invalid_profile_payload" });
    }

    const repository = await createUserRepository(context);
    if (!repository) {
      return json(503, { error: "auth_not_configured" });
    }

    const updatedUser = await repository.updateUserProfile(user.email, profile);
    if (!updatedUser) {
      return json(404, { error: "user_not_found" });
    }

    writeServerLog("info", "User preferences updated", {
      language: profile.language,
      ...describeRequest(request),
      theme: profile.theme,
      username: user.email
    });

    return json(200, {
      user: toAuthenticatedUser(updatedUser)
    });
  }
};

function stableSlug(value: string): string {
  const slug = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80);

  return slug || "user";
}
