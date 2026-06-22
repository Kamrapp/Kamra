import { describe, expect, it } from "vitest";

import {
  type AdminIdentitySeedRepository,
  type AdminUserDocument,
  createAdminUserSeed,
  runAdminIdentitySeed,
  type SeedLedgerRecord
} from "./admin-identity-seed.js";
import type { SeedPrompt } from "./seed-runner.js";

class InMemoryAdminSeedRepository implements AdminIdentitySeedRepository {
  readonly seedLedger: SeedLedgerRecord[] = [];
  private adminUser: AdminUserDocument | null = null;

  async findAdminByEmail(email: string): Promise<AdminUserDocument | null> {
    return this.adminUser?.email === email ? this.adminUser : null;
  }

  async recordSeed(record: SeedLedgerRecord): Promise<void> {
    this.seedLedger.push(record);
  }

  async upsertAdmin(document: AdminUserDocument): Promise<void> {
    this.adminUser = document;
  }

  getAdminUser(): AdminUserDocument | null {
    return this.adminUser;
  }
}

function createInput(password: string) {
  return {
    password,
    username: "Admin@Kamra.Test"
  };
}

describe("runAdminIdentitySeed", () => {
  it("creates the admin identity and records the seed", async () => {
    const repository = new InMemoryAdminSeedRepository();
    const result = await runAdminIdentitySeed(
      createInput("first-password"),
      repository,
      new Date("2026-06-22T10:00:00.000Z")
    );

    expect(result.outcome).toBe("created");
    expect(repository.getAdminUser()).toMatchObject({
      authProvider: "bootstrap_credentials",
      email: "admin@kamra.test",
      role: "admin",
      status: "active"
    });
    expect(repository.getAdminUser()?.passwordHash.hash).not.toContain("first-password");
    expect(repository.seedLedger).toHaveLength(1);
  });

  it("keeps an unchanged admin identity idempotent", async () => {
    const repository = new InMemoryAdminSeedRepository();
    await runAdminIdentitySeed(createInput("same-password"), repository);
    const originalHash = repository.getAdminUser()?.passwordHash.hash;

    const result = await runAdminIdentitySeed(createInput("same-password"), repository);

    expect(result.outcome).toBe("unchanged");
    expect(repository.getAdminUser()?.passwordHash.hash).toBe(originalHash);
    expect(repository.seedLedger).toHaveLength(2);
  });

  it("rotates the password hash when the configured password changes", async () => {
    const repository = new InMemoryAdminSeedRepository();
    await runAdminIdentitySeed(createInput("first-password"), repository);
    const originalHash = repository.getAdminUser()?.passwordHash.hash;

    const result = await runAdminIdentitySeed(createInput("second-password"), repository);

    expect(result.outcome).toBe("password_rotated");
    expect(repository.getAdminUser()?.passwordHash.hash).not.toBe(originalHash);
    expect(repository.seedLedger).toHaveLength(2);
  });

  it("runs from configured seed-specific env values without prompting", async () => {
    const repository = new InMemoryAdminSeedRepository();
    const seed = createAdminUserSeed(repository);
    const prompt: SeedPrompt = {
      confirm: async () => {
        throw new Error("confirm should not be called");
      },
      secret: async () => {
        throw new Error("secret should not be called");
      },
      text: async () => {
        throw new Error("text should not be called");
      }
    };

    const result = await seed.run({
      env: {
        SEED_ADMINUSER_PASSWORD: "env-password",
        SEED_ADMINUSER_USERNAME: "AdminFromEnv@Kamra.Test"
      },
      prompt
    });

    expect(result).toMatchObject({
      outcome: "completed",
      seedName: "admin_identity"
    });
    expect(repository.getAdminUser()?.email).toBe("adminfromenv@kamra.test");
  });
});
