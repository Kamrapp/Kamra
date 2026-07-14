import { MongoUserRepository } from "../../auth/mongo-user-repository.js";
import { hashPassword } from "../../auth/password-hash.js";
import { normalizeUserEmail, type UserRepository } from "../../auth/user-auth.js";
import { describeRequest, json, unauthorized, type AppRoute } from "../app-route-context.js";
import { writeServerLog } from "../../logging/kamra-logger.js";

export const adminUserListRoute: AppRoute = {
  match: (request) => request.method === "GET" && request.path === "/api/admin/users",
  handle: async (request, context) => {
    const admin = context.authenticateRequestUser(request);
    if (!admin || admin.role !== "admin") {
      return unauthorized("apiErrors.adminRequired");
    }

    const repository = await createAdminUserRepository(context);
    if (!repository?.listAdminUsers) {
      return json(503, { error: "user_management_not_configured" });
    }

    return json(200, { users: await repository.listAdminUsers() });
  }
};

export const adminUserPasswordRoute: AppRoute = {
  match: (request) =>
    request.method === "PATCH" &&
    request.path.startsWith("/api/admin/users/") &&
    request.path.endsWith("/password"),
  handle: async (request, context) => {
    const admin = context.authenticateRequestUser(request);
    if (!admin || admin.role !== "admin") {
      return unauthorized("apiErrors.adminRequired");
    }

    const email = readUserEmail(request.path, "/api/admin/users/", "/password");
    const password = readPassword(request.bodyText);
    if (!email || !password) {
      return json(400, { error: "invalid_admin_user_password_payload" });
    }

    const repository = await createAdminUserRepository(context);
    if (!repository?.updateUserPassword) {
      return json(503, { error: "user_management_not_configured" });
    }

    const updated = await repository.updateUserPassword(email, await hashPassword(password));
    if (!updated) {
      return json(404, { error: "user_not_found" });
    }

    writeServerLog("info", "Admin user password reset", {
      ...describeRequest(request),
      targetUser: email,
      username: admin.email
    });
    return json(200, { email, status: "password_updated" });
  }
};

export const adminUserDeleteRoute: AppRoute = {
  match: (request) => request.method === "DELETE" && request.path.startsWith("/api/admin/users/"),
  handle: async (request, context) => {
    const admin = context.authenticateRequestUser(request);
    if (!admin || admin.role !== "admin") {
      return unauthorized("apiErrors.adminRequired");
    }

    const email = readUserEmail(request.path, "/api/admin/users/");
    if (!email) {
      return json(400, { error: "invalid_admin_user_payload" });
    }
    if (email === normalizeUserEmail(admin.email)) {
      return json(409, { error: "cannot_delete_current_admin" });
    }

    const repository = await createAdminUserRepository(context);
    if (!repository?.deleteUser) {
      return json(503, { error: "user_management_not_configured" });
    }

    const result = await repository.deleteUser(email);
    if (!result) {
      return json(404, { error: "user_not_found" });
    }

    writeServerLog("warn", "Admin user deleted", {
      deletedHouseholdCount: result.deletedHouseholdIds.length,
      ...describeRequest(request),
      promotedUserIds: result.promotedUserIds,
      targetUser: email,
      username: admin.email
    });
    return json(200, { email, ...result, status: "user_deleted" });
  }
};

async function createAdminUserRepository(
  context: Parameters<AppRoute["handle"]>[1]
): Promise<UserRepository | null> {
  const config = context.config;
  if (!config.mongodb.uri || !config.mongodb.databaseName) {
    return null;
  }

  const client = await context.getMongoClient(config.mongodb.uri, config.mongodb.dnsServers);
  const database = client.db(config.mongodb.databaseName);
  return context.dependencies.createUserRepository
    ? context.dependencies.createUserRepository(database, client)
    : new MongoUserRepository(database, client);
}

function readUserEmail(path: string, prefix: string, suffix = ""): string | null {
  if (!path.startsWith(prefix) || (suffix && !path.endsWith(suffix))) {
    return null;
  }

  const encodedEmail = path.slice(prefix.length, suffix ? -suffix.length : undefined);
  if (!encodedEmail || encodedEmail.includes("/")) {
    return null;
  }

  try {
    const email = normalizeUserEmail(decodeURIComponent(encodedEmail));
    return email || null;
  } catch {
    return null;
  }
}

function readPassword(bodyText: string | undefined): string | null {
  if (!bodyText) {
    return null;
  }

  try {
    const body = JSON.parse(bodyText) as { password?: unknown };
    return typeof body.password === "string" && body.password.length >= 8 ? body.password : null;
  } catch {
    return null;
  }
}
