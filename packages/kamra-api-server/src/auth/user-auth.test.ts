import { describe, expect, it } from "vitest";

import { hashPassword } from "./password-hash.js";
import {
  authenticateUser,
  type UserDocument,
  type UserRepository
} from "./user-auth.js";

class InMemoryUserRepository implements UserRepository {
  constructor(private readonly user: UserDocument | null) {}

  async findActiveUserByEmail(email: string): Promise<UserDocument | null> {
    return this.user?.email === email && this.user.status === "active"
      ? this.user
      : null;
  }
}

async function createUser(
  password: string,
  overrides: Partial<UserDocument> = {}
): Promise<UserDocument> {
  return {
    authProvider: "bootstrap_credentials",
    email: "admin@kamra.test",
    passwordHash: await hashPassword(password, Buffer.alloc(16, 2)),
    role: "admin",
    status: "active",
    ...overrides
  };
}

describe("authenticateUser", () => {
  it("authenticates an active user with the matching password", async () => {
    const repository = new InMemoryUserRepository(
      await createUser("correct-password")
    );

    await expect(authenticateUser(
      " Admin@Kamra.Test ",
      "correct-password",
      repository
    )).resolves.toEqual({
      status: "authenticated",
      user: {
        email: "admin@kamra.test",
        role: "admin"
      }
    });
  });

  it("rejects a wrong password", async () => {
    const repository = new InMemoryUserRepository(
      await createUser("correct-password")
    );

    await expect(authenticateUser(
      "admin@kamra.test",
      "wrong-password",
      repository
    )).resolves.toEqual({ status: "invalid_credentials" });
  });

  it("rejects a disabled user", async () => {
    const repository = new InMemoryUserRepository(
      await createUser("correct-password", { status: "disabled" })
    );

    await expect(authenticateUser(
      "admin@kamra.test",
      "correct-password",
      repository
    )).resolves.toEqual({ status: "invalid_credentials" });
  });
});
