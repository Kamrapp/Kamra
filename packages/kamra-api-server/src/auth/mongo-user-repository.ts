import type { Collection, Db } from "mongodb";

import type { UserDocument, UserProfile, UserRepository } from "./user-auth.js";

export class MongoUserRepository implements UserRepository {
  private readonly usersCollection: Collection<UserDocument>;

  constructor(database: Db) {
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
