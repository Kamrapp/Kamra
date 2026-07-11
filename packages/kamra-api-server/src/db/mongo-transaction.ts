import type { MongoSessionLike, MongoTransactionClientLike } from "./mongo-like.js";

export async function runMongoTransaction<T>(client: MongoTransactionClientLike, operation: (session: MongoSessionLike) => Promise<T>): Promise<T> {
  const session = client.startSession();
  try {
    session.startTransaction();
    try {
      const result = await operation(session);
      await session.commitTransaction();
      return result;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    }
  } finally {
    await session.endSession();
  }
}
