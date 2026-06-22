import { describe, expect, it } from "vitest";

import { readAppConfig } from "./app-config.js";

describe("readAppConfig", () => {
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
});
