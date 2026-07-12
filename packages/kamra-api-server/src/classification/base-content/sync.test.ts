import { describe, expect, it } from "vitest";
import { createFakeDb } from "../../test-support/fake-mongo.js";
import { MongoBaseClassificationSync } from "./sync.js";

describe("MongoBaseClassificationSync", () => {
  it("creates the pack once and reports repeat-safe results", async () => {
    const db = createFakeDb();
    const sync = new MongoBaseClassificationSync(db);
    const first = await sync.sync();
    const second = await sync.sync();
    expect(first.created).toBe(12);
    expect(second.created).toBe(0);
    expect(second.unchanged).toBe(12);
    expect(second.conflicts).toEqual([]);
  });
});
