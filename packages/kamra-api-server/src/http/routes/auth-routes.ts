import { authenticateUser } from "../../auth/user-auth.js";
import { MongoUserRepository } from "../../auth/mongo-user-repository.js";
import { createUserToken } from "../../auth/user-token.js";
import { writeServerLog } from "../../logging/kamra-logger.js";
import { empty, json, type AppRequest, type AppRoute } from "../app-route-context.js";

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

    const client = await context.getMongoClient(
      config.mongodb.uri,
      config.mongodb.dnsServers
    );
    const repository = context.dependencies.createUserRepository
      ? context.dependencies.createUserRepository(client.db(config.mongodb.databaseName))
      : new MongoUserRepository(client.db(config.mongodb.databaseName));
    const result = await authenticateUser(payload.email, payload.password, repository);

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
      username: result.user.email
    });

    return json(200, {
      token,
      tokenType: "Bearer",
      user: result.user
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
      return json(401, {
        error: "unauthorized",
        message: "Sign in to view this resource."
      });
    }

    return json(200, { user });
  }
};
