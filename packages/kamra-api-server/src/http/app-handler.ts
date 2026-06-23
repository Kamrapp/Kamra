import { readAppConfig } from "../config/app-config.js";
import { authenticateUser, type AuthenticatedUser } from "../auth/user-auth.js";
import { MongoUserRepository } from "../auth/mongo-user-repository.js";
import { createUserToken, verifyUserToken } from "../auth/user-token.js";
import { getMongoClient } from "../db/mongo-client.js";
import { getHealthResult } from "../health/get-health-report.js";
import { writeBrowserLog, writeServerLog } from "../logging/kamra-logger.js";

export interface AppRequest {
  headers: Record<string, string | string[] | undefined>;
  method: string;
  path: string;
  bodyText?: string;
}

export interface AppResponse {
  body: string;
  headers: Record<string, string>;
  status: number;
}

function json(status: number, payload: unknown): AppResponse {
  return {
    body: JSON.stringify(payload),
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store"
    },
    status
  };
}

function empty(status: number): AppResponse {
  return {
    body: "",
    headers: {
      "cache-control": "no-store"
    },
    status
  };
}

function getHeader(
  headers: AppRequest["headers"],
  name: string
): string | null {
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

function authenticateRequestUser(request: AppRequest): AuthenticatedUser | null {
  const config = readAppConfig();
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

function unauthorized(message = "Sign in to view this resource."): AppResponse {
  return json(401, {
    error: "unauthorized",
    message
  });
}

export async function handleAppRequest(request: AppRequest): Promise<AppResponse> {
  if (request.method === "POST" && request.path === "/api/log") {
    try {
      const payload = JSON.parse(request.bodyText ?? "{}") as {
        details?: unknown;
        level?: "debug" | "info" | "warn" | "error";
        message?: string;
      };

      if (typeof payload.message !== "string" || typeof payload.level !== "string") {
        return json(400, { error: "invalid_log_payload" });
      }

      writeBrowserLog(payload.level, payload.message, payload.details);

      return {
        body: "",
        headers: {
          "cache-control": "no-store"
        },
        status: 204
      };
    } catch {
      return json(400, { error: "invalid_log_payload" });
    }
  }

  if (request.method === "POST" && request.path === "/api/login") {
    const config = readAppConfig();
    const payload = readLoginPayload(request.bodyText);

    if (!payload) {
      return json(400, { error: "invalid_login_payload" });
    }

    if (!config.auth.tokenSecret || !config.mongodb.uri || !config.mongodb.databaseName) {
      return json(503, { error: "auth_not_configured" });
    }

    const client = await getMongoClient(
      config.mongodb.uri,
      config.mongodb.dnsServers
    );
    const repository = new MongoUserRepository(client.db(config.mongodb.databaseName));
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

  if (request.method === "POST" && request.path === "/api/logout") {
    return empty(204);
  }

  if (request.method === "GET" && request.path === "/api/admin/me") {
    const user = authenticateRequestUser(request);
    if (!user) {
      return unauthorized();
    }

    return json(200, { user });
  }

  if (request.method === "GET" && request.path === "/api/health") {
    const user = authenticateRequestUser(request);
    if (!user || user.role !== "admin") {
      return unauthorized("Sign in as an admin to view this resource.");
    }

    const config = readAppConfig();
    const result = await getHealthResult(config, {
      onHealthCheckFailed: (error) => {
        writeServerLog("error", "Health check failed", error);
      },
      pingMongo: async () => {
        if (!config.mongodb.uri || !config.mongodb.databaseName) {
          return;
        }

        const client = await getMongoClient(
          config.mongodb.uri,
          config.mongodb.dnsServers
        );
        await client.db(config.mongodb.databaseName).command({ ping: 1 });
      }
    });

    writeServerLog("info", "Health check completed", {
      databaseName: result.report.checks.database.databaseName,
      databaseStatus: result.report.checks.database.status,
      requestPath: request.path,
      status: result.report.status,
      statusCode: result.statusCode
    });

    return json(result.statusCode, result.report);
  }

  return json(404, {
    error: "not_found"
  });
}
