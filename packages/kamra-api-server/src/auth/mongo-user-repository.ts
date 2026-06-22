import type { Collection, Db } from "mongodb";

import type { UserDocument, UserRepository } from "./user-auth.js";

export class MongoUserRepository implements UserRepository {
  private readonly usersCollection: Collection<UserDocument>;

  constructor(database: Db) {
    this.usersCollection = database.collection<UserDocument>("users");
  }

  async findActiveUserByEmail(email: string): Promise<UserDocument | null> {
    return await this.usersCollection.findOne({
      email,
      role: "admin",
      status: "active"
    });
  }
}
