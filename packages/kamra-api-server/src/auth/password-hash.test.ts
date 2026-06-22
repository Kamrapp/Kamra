import { describe, expect, it } from "vitest";

import { hashPassword, verifyPassword } from "./password-hash.js";

describe("password hashing", () => {
  it("verifies a matching password", async () => {
    const passwordHash = await hashPassword("correct horse pantry staple", Buffer.alloc(16, 1));

    await expect(verifyPassword("correct horse pantry staple", passwordHash)).resolves.toBe(true);
  });

  it("rejects a different password", async () => {
    const passwordHash = await hashPassword("correct horse pantry staple", Buffer.alloc(16, 1));

    await expect(verifyPassword("wrong password", passwordHash)).resolves.toBe(false);
  });
});
