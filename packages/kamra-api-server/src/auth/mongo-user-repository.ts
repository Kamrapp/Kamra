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
    const result = await this.usersCollection.findOneAndUpdate(
      {
        email,
        status: "active"
      },
      {
        $set: {
          profile,
          updatedAt: new Date()
        }
      },
      {
        returnDocument: "after"
      }
    );

    return result;
  }
}
