import { writeBrowserLog } from "../../logging/kamra-logger.js";
import { describeRequest, json, type AppRoute } from "../app-route-context.js";

export const logRoute: AppRoute = {
  match: (request) => request.method === "POST" && request.path === "/api/log",
  handle: async (request) => {
    try {
      const payload = JSON.parse(request.bodyText ?? "{}") as {
        details?: unknown;
        level?: "debug" | "info" | "warn" | "error";
        message?: string;
      };

      if (typeof payload.message !== "string" || typeof payload.level !== "string") {
        return json(400, { error: "invalid_log_payload" });
      }

      writeBrowserLog(payload.level, payload.message, {
        ...describeRequest(request),
        details: payload.details
      });

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
};
