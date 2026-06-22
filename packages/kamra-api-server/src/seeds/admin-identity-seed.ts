import { hashPassword, type PasswordHash, verifyPassword } from "../auth/password-hash.js";
import type { SeedDefinition, SeedExecutionContext } from "./seed-runner.js";

export const adminIdentitySeedName = "admin_identity";
export const seedAdminUserUsernameEnvName = "SEED_ADMINUSER_USERNAME";
export const seedAdminUserPasswordEnvName = "SEED_ADMINUSER_PASSWORD";

export interface AdminIdentitySeedInput {
  password: string;
  username: string;
}

export interface AdminUserDocument {
  authProvider: "bootstrap_credentials";
  createdAt: Date;
  email: string;
  passwordHash: PasswordHash;
  role: "admin";
  status: "active";
  updatedAt: Date;
}

export interface SeedLedgerRecord {
  completedAt: Date;
  details: unknown;
  seedName: string;
  status: "ok";
}

export interface AdminIdentitySeedRepository {
  findAdminByEmail(email: string): Promise<AdminUserDocument | null>;
  recordSeed(record: SeedLedgerRecord): Promise<void>;
  setup?(): Promise<void>;
  upsertAdmin(document: AdminUserDocument): Promise<void>;
}

export interface AdminIdentitySeedResult {
  outcome: "created" | "password_rotated" | "unchanged";
  seedName: typeof adminIdentitySeedName;
  username: string;
}

export async function runAdminIdentitySeed(
  input: AdminIdentitySeedInput,
  repository: AdminIdentitySeedRepository,
  now = new Date()
): Promise<AdminIdentitySeedResult> {
  const username = normalizeUsername(input.username);

  await repository.setup?.();

  const existingAdmin = await repository.findAdminByEmail(username);
  const passwordMatches = existingAdmin
    ? await verifyPassword(input.password, existingAdmin.passwordHash)
    : false;

  const outcome: AdminIdentitySeedResult["outcome"] = existingAdmin
    ? passwordMatches ? "unchanged" : "password_rotated"
    : "created";

  if (outcome !== "unchanged") {
    await repository.upsertAdmin({
      authProvider: "bootstrap_credentials",
      createdAt: existingAdmin?.createdAt ?? now,
      email: username,
      passwordHash: await hashPassword(input.password),
      role: "admin",
      status: "active",
      updatedAt: now
    });
  }

  const result: AdminIdentitySeedResult = {
    outcome,
    seedName: adminIdentitySeedName,
    username
  };

  await repository.recordSeed({
    completedAt: now,
    details: result,
    seedName: adminIdentitySeedName,
    status: "ok"
  });

  return result;
}

export function createAdminUserSeed(
  repository: AdminIdentitySeedRepository
): SeedDefinition {
  return {
    configured: isAdminUserSeedConfigured,
    label: "admin user",
    name: adminIdentitySeedName,
    optional: true,
    run: async (context: SeedExecutionContext) => {
      const input = await readAdminIdentitySeedInput(context);
      const result = await runAdminIdentitySeed(input, repository);

      return {
        details: {
          outcome: result.outcome,
          username: result.username
        },
        outcome: "completed",
        seedName: adminIdentitySeedName
      };
    }
  };
}

function isAdminUserSeedConfigured(env: NodeJS.ProcessEnv): boolean {
  return Boolean(readSeedEnvValue(env, seedAdminUserUsernameEnvName) && env[seedAdminUserPasswordEnvName]);
}

async function readAdminIdentitySeedInput(
  context: SeedExecutionContext
): Promise<AdminIdentitySeedInput> {
  const username = readSeedEnvValue(context.env, seedAdminUserUsernameEnvName)
    ?? await context.prompt.text("Admin username");
  const password = context.env[seedAdminUserPasswordEnvName]
    ?? await context.prompt.secret("Admin password");

  if (!username.trim()) {
    throw new Error(`${seedAdminUserUsernameEnvName} is required for the admin user seed.`);
  }

  if (!password) {
    throw new Error(`${seedAdminUserPasswordEnvName} is required for the admin user seed.`);
  }

  return {
    password,
    username
  };
}

function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

function readSeedEnvValue(env: NodeJS.ProcessEnv, name: string): string | null {
  return env[name]?.trim() || null;
}
