import { describe, expect, it } from "vitest";

import { createUserToken, verifyUserToken } from "./user-token.js";

describe("user tokens", () => {
  it("verifies a signed user token", () => {
    const token = createUserToken({
      email: "admin@kamra.test",
      maxAgeSeconds: 60,
      now: new Date("2026-06-22T10:00:00.000Z"),
      role: "admin",
      secret: "test-secret"
    });

    expect(verifyUserToken(
      token,
      "test-secret",
      new Date("2026-06-22T10:00:30.000Z")
    )).toEqual({
      payload: {
        email: "admin@kamra.test",
        exp: 1782122460,
        iat: 1782122400,
        role: "admin",
        sub: "admin@kamra.test"
      },
      status: "valid"
    });
  });

  it("rejects a tampered token", () => {
    const token = createUserToken({
      email: "admin@kamra.test",
      maxAgeSeconds: 60,
      now: new Date("2026-06-22T10:00:00.000Z"),
      role: "admin",
      secret: "test-secret"
    });

    const tamperedToken = token.replace("a", "b");

    expect(verifyUserToken(
      tamperedToken,
      "test-secret",
      new Date("2026-06-22T10:00:30.000Z")
    )).toEqual({ status: "invalid" });
  });

  it("rejects an expired token", () => {
    const token = createUserToken({
      email: "admin@kamra.test",
      maxAgeSeconds: 60,
      now: new Date("2026-06-22T10:00:00.000Z"),
      role: "admin",
      secret: "test-secret"
    });

    expect(verifyUserToken(
      token,
      "test-secret",
      new Date("2026-06-22T10:01:01.000Z")
    )).toEqual({ status: "expired" });
  });

  it("verifies a signed non-admin user token", () => {
    const token = createUserToken({
      email: "user@kamra.test",
      maxAgeSeconds: 60,
      now: new Date("2026-06-22T10:00:00.000Z"),
      role: "user",
      secret: "test-secret"
    });

    expect(verifyUserToken(
      token,
      "test-secret",
      new Date("2026-06-22T10:00:30.000Z")
    )).toEqual({
      payload: {
        email: "user@kamra.test",
        exp: 1782122460,
        iat: 1782122400,
        role: "user",
        sub: "user@kamra.test"
      },
      status: "valid"
    });
  });
});
