import { authenticateUser, type UserRepository } from "../../auth/user-auth.js";
import { MongoUserRepository } from "../../auth/mongo-user-repository.js";
import { createUserToken } from "../../auth/user-token.js";
import { MongoFeatureFlagStore } from "../../feature-toggles/mongo-store.js";
import { FeatureFlagService } from "../../feature-toggles/service.js";
import { writeServerLog } from "../../logging/kamra-logger.js";
import { describeRequest, empty, json, type AppRoute } from "../app-route-context.js";

const autoLoginUserNameEnvName = "AUTO_LOGIN_USER_NAME";
const autoLoginPasswordEnvName = "AUTO_LOGIN_PASSWORD";

export const autoLoginRoute: AppRoute = {
  match: (request) => request.method === "POST" && request.path === "/api/auto-login",
  handle: async (request, context) => {
    if (context.authenticateRequestUser(request)) {
      return empty(204);
    }

    const config = context.config;
    if (!config.auth.tokenSecret || !config.mongodb.uri || !config.mongodb.databaseName) {
      return empty(204);
    }

    const client = await context.getMongoClient(config.mongodb.uri, config.mongodb.dnsServers);
    const database = client.db(config.mongodb.databaseName);
    const featureFlags = new FeatureFlagService(new MongoFeatureFlagStore(database));
    const automaticLoginEnabled = (await featureFlags.evaluate("allowAutomaticLogin")).enabled;
    if (!automaticLoginEnabled) {
      return empty(204);
    }

    const userName = process.env[autoLoginUserNameEnvName]?.trim();
    const password = process.env[autoLoginPasswordEnvName];
    if (!userName || !password) {
      return empty(204);
    }

    const repository: UserRepository = context.dependencies.createUserRepository
      ? context.dependencies.createUserRepository(database)
      : new MongoUserRepository(database);
    const alphaAccessEnabled = (await featureFlags.evaluate("allowControlledAlphaAccess")).enabled;
    const result = await authenticateUser(userName, password, repository, {
      alphaAccessEnabled
    });

    if (result.status !== "authenticated") {
      writeServerLog(
        "warn",
        "Automatic user login skipped because configured credentials were rejected",
        {
          ...describeRequest(request)
        }
      );
      return empty(204);
    }

    const token = createUserToken({
      email: result.user.email,
      maxAgeSeconds: config.auth.tokenMaxAgeSeconds,
      role: result.user.role,
      secret: config.auth.tokenSecret
    });

    writeServerLog("info", "Automatic user login completed", {
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
