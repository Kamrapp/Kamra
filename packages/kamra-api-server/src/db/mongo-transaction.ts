import type { MongoSessionLike, MongoTransactionClientLike } from "./mongo-like.js";

export async function runMongoTransaction<T>(
  client: MongoTransactionClientLike,
  operation: (session: MongoSessionLike) => Promise<T>
): Promise<T> {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const session = client.startSession();
    try {
      session.startTransaction();
      try {
        const result = await operation(session);
        await session.commitTransaction();
        return result;
      } catch (error) {
        await session.abortTransaction();
        if (attempt === 2 || !hasMongoErrorLabel(error, "TransientTransactionError")) throw error;
      }
    } finally {
      await session.endSession();
    }
  }

  throw new Error("mongo_transaction_retry_exhausted");
}

function hasMongoErrorLabel(error: unknown, label: string): boolean {
  if (typeof error !== "object" || error === null || !("hasErrorLabel" in error)) return false;
  const hasErrorLabel = (error as { hasErrorLabel?: unknown }).hasErrorLabel;
  return typeof hasErrorLabel === "function" && hasErrorLabel.call(error, label) === true;
}
