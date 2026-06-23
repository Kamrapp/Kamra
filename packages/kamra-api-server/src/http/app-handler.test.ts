import { afterEach, describe, expect, it, vi } from "vitest";

import { createUserToken } from "../auth/user-token.js";
import { handleAppRequest } from "./app-handler.js";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("handleAppRequest auth guards", () => {
  it("rejects health checks without a user token", async () => {
    vi.stubEnv("AUTH_TOKEN_SECRET", "test-secret");

    const response = await handleAppRequest({
      headers: {},
      method: "GET",
      path: "/api/health"
    });

    expect(response.status).toBe(401);
    expect(JSON.parse(response.body)).toEqual({
      error: "unauthorized",
      message: "Sign in as an admin to view this resource."
    });
  });

  it("allows health checks with a valid admin user token", async () => {
    vi.stubEnv("AUTH_TOKEN_SECRET", "test-secret");

    const token = createUserToken({
      email: "admin@kamra.test",
      maxAgeSeconds: 60,
      now: new Date(),
      role: "admin",
      secret: "test-secret"
    });

    const response = await handleAppRequest({
      headers: {
        authorization: `Bearer ${token}`
      },
      method: "GET",
      path: "/api/health"
    });

    expect(response.status).toBe(503);
    expect(JSON.parse(response.body)).toMatchObject({
      checks: {
        api: {
          status: "ok"
        },
        database: {
          status: "not_configured"
        }
      },
      status: "degraded"
    });
  });

  it("allows current-user lookup with a valid non-admin token", async () => {
    vi.stubEnv("AUTH_TOKEN_SECRET", "test-secret");

    const token = createUserToken({
      email: "user@kamra.test",
      maxAgeSeconds: 60,
      now: new Date(),
      role: "user",
      secret: "test-secret"
    });

    const response = await handleAppRequest({
      headers: {
        authorization: `Bearer ${token}`
      },
      method: "GET",
      path: "/api/admin/me"
    });

    expect(response.status).toBe(200);
    expect(JSON.parse(response.body)).toEqual({
      user: {
        email: "user@kamra.test",
        role: "user"
      }
    });
  });

  it("rejects health checks for a valid non-admin token", async () => {
    vi.stubEnv("AUTH_TOKEN_SECRET", "test-secret");

    const token = createUserToken({
      email: "user@kamra.test",
      maxAgeSeconds: 60,
      now: new Date(),
      role: "user",
      secret: "test-secret"
    });

    const response = await handleAppRequest({
      headers: {
        authorization: `Bearer ${token}`
      },
      method: "GET",
      path: "/api/health"
    });

    expect(response.status).toBe(401);
    expect(JSON.parse(response.body)).toEqual({
      error: "unauthorized",
      message: "Sign in as an admin to view this resource."
    });
  });
});
