import type { Collection, Db } from "mongodb";

import type {
  AdminIdentitySeedRepository,
  AdminUserDocument,
  SeedLedgerRecord
} from "./admin-identity-seed.js";

export class MongoAdminIdentitySeedRepository implements AdminIdentitySeedRepository {
  private readonly seedLedgerCollection: Collection<SeedLedgerRecord>;
  private readonly usersCollection: Collection<AdminUserDocument>;

  constructor(database: Db) {
    this.seedLedgerCollection = database.collection<SeedLedgerRecord>("seed_ledger");
    this.usersCollection = database.collection<AdminUserDocument>("users");
  }

  async setup(): Promise<void> {
    await Promise.all([
      this.usersCollection.createIndex(
        { email: 1 },
        { name: "users_email_unique", unique: true }
      ),
      this.seedLedgerCollection.createIndex(
        { seedName: 1, completedAt: -1 },
        { name: "seed_ledger_seed_completed_at" }
      )
    ]);
  }

  async findAdminByEmail(email: string): Promise<AdminUserDocument | null> {
    return await this.usersCollection.findOne({
      email,
      role: "admin"
    });
  }

  async upsertAdmin(document: AdminUserDocument): Promise<void> {
    await this.usersCollection.updateOne(
      { email: document.email },
      {
        $set: {
          authProvider: document.authProvider,
          passwordHash: document.passwordHash,
          role: document.role,
          status: document.status,
          updatedAt: document.updatedAt
        },
        $setOnInsert: {
          createdAt: document.createdAt,
          email: document.email
        }
      },
      { upsert: true }
    );
  }

  async recordSeed(record: SeedLedgerRecord): Promise<void> {
    await this.seedLedgerCollection.insertOne(record);
  }
}
