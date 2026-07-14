import { describe, expect, it } from "vitest";

import {
  findShoppingQuickAddMatch,
  normalizeShoppingQuickAddName
} from "./shopping-quick-add-matching";

describe("shopping quick-add matching", () => {
  it("matches names without case, accent, or punctuation differences", () => {
    const milk = { displayName: "Pilos 1.5% tej" };

    expect(findShoppingQuickAddMatch("pilos 1,5 tej", [milk])).toBe(milk);
    expect(findShoppingQuickAddMatch("PILOS 1.5% TEJ", [milk])).toBe(milk);
  });

  it("returns no match for unrelated or empty names", () => {
    const products = [{ displayName: "Pilos tej" }];

    expect(findShoppingQuickAddMatch("Kenyér", products)).toBeNull();
    expect(findShoppingQuickAddMatch("", products)).toBeNull();
  });

  it("keeps the same stable key used for duplicate shopping-line detection", () => {
    expect(normalizeShoppingQuickAddName("  Áfonya / friss! ")).toBe("afonya_friss");
  });
});
