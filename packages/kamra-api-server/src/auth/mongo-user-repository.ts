import type { Collection, Db } from "mongodb";

import type { UserDocument, UserProfile, UserRepository } from "./user-auth.js";

export class MongoUserRepository implements UserRepository {
  private readonly usersCollection: Collection<UserDocument>;

  constructor(database: Db) {
    this.usersCollection = database.collection<UserDocument>("users");
  }

  async findActiveUserByEmail(email: string): Promise<UserDocument | null> {
    return await this.usersCollection.findOne({
      email,
      status: "active"
    });
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
