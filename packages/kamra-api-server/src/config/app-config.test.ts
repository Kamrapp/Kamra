import { describe, expect, it } from "vitest";

import { findAllowedCorsOrigin, readAppConfig } from "./app-config.js";

describe("readAppConfig", () => {
  it("reads auth token configuration", () => {
    const result = readAppConfig({
      AUTH_TOKEN_SECRET: "local-secret"
    });

    expect(result.auth).toEqual({
      tokenMaxAgeSeconds: 28800,
      tokenSecret: "local-secret",
      tokenSecretConfigured: true
    });
  });

  it("marks auth token configuration as missing when the secret is not set", () => {
    const result = readAppConfig({});

    expect(result.auth.tokenSecret).toBeNull();
    expect(result.auth.tokenSecretConfigured).toBe(false);
  });

  it("uses the default Atlas DNS fallback when MongoDB is configured without an override", () => {
    const result = readAppConfig({
      MONGODB_DB_NAME: "kamra_test",
      MONGODB_URI: "mongodb+srv://user:pass@example.mongodb.net/"
    });

    expect(result.mongodb.dnsServers).toEqual(["1.1.1.1", "8.8.8.8"]);
  });

  it("prefers an explicit MongoDB DNS override when provided", () => {
    const result = readAppConfig({
      MONGODB_DB_NAME: "kamra_test",
      MONGODB_DNS_SERVERS: "9.9.9.9, 8.8.4.4",
      MONGODB_URI: "mongodb+srv://user:pass@example.mongodb.net/"
    });

    expect(result.mongodb.dnsServers).toEqual(["9.9.9.9", "8.8.4.4"]);
  });

  it("does not apply MongoDB DNS servers when MongoDB is not configured", () => {
    const result = readAppConfig({});

    expect(result.mongodb.dnsServers).toBeNull();
  });

  it("normalizes configured CORS origins and patterns", () => {
    const result = readAppConfig({
      CORS_ALLOWED_ORIGINS: " https://kamra.example , https://admin.example/invalid/path , http://localhost:4200/ ",
      CORS_ALLOWED_ORIGIN_PATTERNS: " https://*.vercel.app/ , not-a-url "
    });

    expect(result.cors.allowedOrigins).toEqual([
      "https://kamra.example",
      "http://localhost:4200"
    ]);
    expect(result.cors.allowedOriginPatterns).toEqual([
      "https://*.vercel.app"
    ]);
  });

  it("matches exact configured CORS origins", () => {
    const config = readAppConfig({
      CORS_ALLOWED_ORIGINS: "https://kamra.example/"
    });

    expect(findAllowedCorsOrigin(config, "https://kamra.example")).toBe("https://kamra.example");
    expect(findAllowedCorsOrigin(config, "https://other.example")).toBeNull();
  });

  it("matches configured wildcard CORS origin patterns", () => {
    const config = readAppConfig({
      CORS_ALLOWED_ORIGIN_PATTERNS: "https://*.vercel.app"
    });

    expect(findAllowedCorsOrigin(config, "https://project-preview.vercel.app")).toBe("https://project-preview.vercel.app");
    expect(findAllowedCorsOrigin(config, "https://vercel.app")).toBeNull();
    expect(findAllowedCorsOrigin(config, "https://project-preview.example.com")).toBeNull();
  });
});
