import { describe, expect, it } from "vitest";

import {
  hasRecordArrayProperty,
  hasRecordProperty,
  isRecord,
  isRecordArray
} from "./api-response-guards";

describe("API response shape guards", () => {
  it("accepts object and object-array boundaries", () => {
    const payload = { items: [{ id: "one" }] };

    expect(isRecord(payload)).toBe(true);
    expect(isRecordArray(payload.items)).toBe(true);
    expect(hasRecordArrayProperty(payload, "items")).toBe(true);
    expect(hasRecordProperty({ result: { id: "one" } }, "result")).toBe(true);
  });

  it("rejects missing, scalar, and mixed-shape response properties", () => {
    expect(isRecord(null)).toBe(false);
    expect(isRecordArray([{ id: "one" }, null])).toBe(false);
    expect(hasRecordArrayProperty({}, "items")).toBe(false);
    expect(hasRecordProperty({ result: "wrong" }, "result")).toBe(false);
  });
});
