import { afterEach, describe, expect, it, vi } from "vitest";

import { handleAppRequest } from "./app-handler.js";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("handleAppRequest CORS", () => {
  it("responds to health probes without authentication", async () => {
    const response = await handleAppRequest({
      headers: {},
      method: "GET",
      path: "/api/healthz"
    });

    expect(response.status).toBe(200);
    expect(JSON.parse(response.body)).toEqual({
      status: "ok"
    });
  });

  it("responds to bare health probes without authentication", async () => {
    const response = await handleAppRequest({
      headers: {},
      method: "GET",
      path: "/healthz"
    });

    expect(response.status).toBe(200);
    expect(JSON.parse(response.body)).toEqual({
      status: "ok"
    });
  });

  it("adds CORS headers for allowed exact origins", async () => {
    vi.stubEnv("CORS_ALLOWED_ORIGINS", "https://kamra.example");

    const response = await handleAppRequest({
      headers: {
        origin: "https://kamra.example"
      },
      method: "GET",
      path: "/api/healthz"
    });

    expect(response.status).toBe(200);
    expect(response.headers["access-control-allow-origin"]).toBe("https://kamra.example");
    expect(response.headers["vary"]).toBe("Origin");
  });

  it("accepts preflight requests for configured preview patterns", async () => {
    vi.stubEnv("CORS_ALLOWED_ORIGIN_PATTERNS", "https://*.vercel.app");

    const response = await handleAppRequest({
      headers: {
        origin: "https://project-preview.vercel.app"
      },
      method: "OPTIONS",
      path: "/api/catalog/products"
    });

    expect(response.status).toBe(204);
    expect(response.headers["access-control-allow-origin"]).toBe("https://project-preview.vercel.app");
    expect(response.headers["access-control-allow-methods"]).toContain("GET");
    expect(response.headers["access-control-allow-headers"]).toContain("Authorization");
  });

  it("rejects preflight requests for disallowed origins", async () => {
    vi.stubEnv("CORS_ALLOWED_ORIGINS", "https://kamra.example");

    const response = await handleAppRequest({
      headers: {
        origin: "https://other.example"
      },
      method: "OPTIONS",
      path: "/api/catalog/products"
    });

    expect(response.status).toBe(403);
    expect(response.headers["access-control-allow-origin"]).toBeUndefined();
  });
});
