import { json, type AppRequest, type AppRoute } from "../app-route-context.js";

export const healthzRoute: AppRoute = {
  match: (request: AppRequest) => request.method === "GET" && request.path === "/api/healthz",
  handle: async () => json(200, {
    status: "ok"
  })
};
