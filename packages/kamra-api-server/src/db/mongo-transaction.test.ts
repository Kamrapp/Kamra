import { describe, expect, it } from "vitest";
import { runMongoTransaction } from "./mongo-transaction.js";
import type { MongoSessionLike, MongoTransactionClientLike } from "./mongo-like.js";

function fakeClient(): MongoTransactionClientLike & { calls: string[] } {
  const calls: string[] = [];
  const session: MongoSessionLike = { abortTransaction: async () => { calls.push("abort"); }, commitTransaction: async () => { calls.push("commit"); }, endSession: async () => { calls.push("end"); }, startTransaction: () => { calls.push("start"); } };
  return { calls, startSession: () => session };
}

describe("runMongoTransaction", () => {
  it("commits and closes successful work", async () => {
    const client = fakeClient(); expect(await runMongoTransaction(client, async () => "ok")).toBe("ok"); expect(client.calls).toEqual(["start", "commit", "end"]);
  });
  it("aborts and closes failed work", async () => {
    const client = fakeClient(); await expect(runMongoTransaction(client, async () => { throw new Error("boom"); })).rejects.toThrow("boom"); expect(client.calls).toEqual(["start", "abort", "end"]);
  });
});
