import type { Collection, Db } from "mongodb";

import { MongoHouseholdRepository } from "../household/current/mongo-household-repository.js";
import type {
  AdminUserDeletionResult,
  AdminUserListItem,
  UserDocument,
  UserProfile,
  UserRepository
} from "./user-auth.js";
import type { MongoTransactionClientLike } from "../db/mongo-like.js";
import type { HouseholdMembershipRecord, HouseholdRecord } from "../household/v1/contracts.js";

export class MongoUserRepository implements UserRepository {
  private readonly usersCollection: Collection<UserDocument>;
  private readonly database: Db;
  private readonly householdRepository: MongoHouseholdRepository;
  private readonly transactionClient?: MongoTransactionClientLike;

  constructor(database: Db, transactionClient?: MongoTransactionClientLike) {
    this.database = database;
    this.householdRepository = new MongoHouseholdRepository(database);
    this.transactionClient = transactionClient;
    this.usersCollection = database.collection<UserDocument>("users");
  }

  async createAlphaUser(
    input: Parameters<UserRepository["createAlphaUser"]>[0]
  ): Promise<UserDocument> {
    const now = new Date();
    const user: UserDocument = {
      alphaAccess: input.alphaAccess,
      authProvider: "bootstrap_credentials",
      createdAt: now,
      email: input.email,
      passwordHash: input.passwordHash,
      role: input.role,
      status: input.status,
      updatedAt: now
    };

    await this.usersCollection.insertOne(user);
    return user;
  }

  async createRegisteredUser(
    input: Parameters<NonNullable<UserRepository["createRegisteredUser"]>>[0]
  ): Promise<UserDocument> {
    const now = new Date();
    const user: UserDocument = {
      authProvider: "bootstrap_credentials",
      createdAt: now,
      email: input.email,
      passwordHash: input.passwordHash,
      role: input.role,
      status: input.status,
      updatedAt: now
    };

    await this.usersCollection.insertOne(user);
    return user;
  }

  async findActiveUserByEmail(email: string): Promise<UserDocument | null> {
    return await this.usersCollection.findOne({
      email,
      status: "active"
    });
  }

  async findUserByEmail(email: string): Promise<UserDocument | null> {
    return await this.usersCollection.findOne({ email });
  }

  async listAdminUsers(): Promise<AdminUserListItem[]> {
    const [users, memberships, households] = await Promise.all([
      this.usersCollection.find({}).toArray(),
      this.database
        .collection<HouseholdMembershipRecord>("household_memberships")
        .find({ status: "active" })
        .toArray(),
      this.database.collection<HouseholdRecord>("households").find({}).toArray()
    ]);
    const householdById = new Map(households.map((household) => [household.id, household]));
    const membershipsByUser = new Map<string, HouseholdMembershipRecord[]>();
    for (const membership of memberships) {
      const existing = membershipsByUser.get(membership.userId) ?? [];
      existing.push(membership);
      membershipsByUser.set(membership.userId, existing);
    }

    return users
      .map((user) => ({
        createdAt: user.createdAt?.toISOString() ?? null,
        email: user.email,
        households: (membershipsByUser.get(user.email) ?? [])
          .map((membership) => ({
            householdId: membership.householdId,
            householdName:
              householdById.get(membership.householdId)?.name ?? membership.householdId,
            role: membership.role
          }))
          .sort((left, right) => left.householdName.localeCompare(right.householdName)),
        role: user.role,
        status: user.status
      }))
      .sort((left, right) => left.email.localeCompare(right.email));
  }

  async updateUserPassword(
    email: string,
    passwordHash: UserDocument["passwordHash"]
  ): Promise<boolean> {
    const result = await this.usersCollection.updateOne(
      { email },
      { $set: { passwordHash, updatedAt: new Date() } }
    );
    return result.matchedCount > 0;
  }

  async deleteUser(email: string): Promise<AdminUserDeletionResult | null> {
    const user = await this.findUserByEmail(email);
    if (!user) {
      return null;
    }

    const membershipsCollection =
      this.database.collection<HouseholdMembershipRecord>("household_memberships");
    const activeMemberships = await membershipsCollection
      .find({ userId: email, status: "active" })
      .toArray();
    const deletedHouseholdIds: string[] = [];
    const promotedUserIds: string[] = [];

    for (const membership of activeMemberships) {
      const otherMemberships = await membershipsCollection
        .find({
          householdId: membership.householdId,
          status: "active",
          userId: { $ne: email }
        })
        .toArray();
      const otherOwners = otherMemberships.filter((candidate) => candidate.role === "owner");

      if (membership.role === "owner" && otherOwners.length === 0) {
        if (otherMemberships.length === 0) {
          if (!this.transactionClient) {
            throw new Error("user_deletion_transaction_not_configured");
          }
          await this.householdRepository.resetHouseholdContent({
            householdId: membership.householdId,
            scope: "delete_household",
            transactionClient: this.transactionClient,
            userId: email
          });
          deletedHouseholdIds.push(membership.householdId);
          continue;
        }

        const nextOwner = [...otherMemberships].sort((left, right) =>
          `${left.createdAt}:${left.userId}`.localeCompare(`${right.createdAt}:${right.userId}`)
        )[0];
        if (nextOwner) {
          await membershipsCollection.updateOne(
            { id: nextOwner.id },
            { $set: { role: "owner", updatedAt: new Date().toISOString() } }
          );
          promotedUserIds.push(nextOwner.userId);
        }
      }
    }

    const removedMemberships = await membershipsCollection.deleteMany({ userId: email });
    await this.database.collection("household_invitations").deleteMany({ email });
    await this.usersCollection.deleteMany({ email });

    return {
      deletedHouseholdIds,
      promotedUserIds,
      removedMembershipCount: removedMemberships.deletedCount ?? 0
    };
  }

  async updateUserProfile(email: string, profile: UserProfile): Promise<UserDocument | null> {
    const fieldsToSet: Record<string, Date | UserProfile[keyof UserProfile]> = {
      updatedAt: new Date()
    };

    if (profile.language !== undefined) {
      fieldsToSet["profile.language"] = profile.language;
    }

    if (profile.theme !== undefined) {
      fieldsToSet["profile.theme"] = profile.theme;
    }

    const result = await this.usersCollection.findOneAndUpdate(
      {
        email,
        status: "active"
      },
      {
        $set: fieldsToSet
      },
      {
        returnDocument: "after"
      }
    );

    return result;
  }
}
