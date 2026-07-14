import { describe, expect, it } from "vitest";

import enTranslations from "./en.json";
import huTranslations from "./hu.json";

describe("application translations", () => {
  it("keeps English and Hungarian leaf keys aligned with non-empty values", () => {
    const english = flattenLeafValues(enTranslations);
    const hungarian = flattenLeafValues(huTranslations);

    expect([...hungarian.keys()].sort()).toEqual([...english.keys()].sort());
    expect([...english.entries()].every(([, value]) => value.trim().length > 0)).toBe(true);
    expect([...hungarian.entries()].every(([, value]) => value.trim().length > 0)).toBe(true);
  });
});

function flattenLeafValues(value: unknown, prefix = ""): Map<string, string> {
  if (typeof value === "string") return new Map([[prefix, value]]);
  if (!value || typeof value !== "object" || Array.isArray(value)) return new Map();

  const result = new Map<string, string>();
  for (const [key, child] of Object.entries(value)) {
    const childPrefix = prefix ? `${prefix}.${key}` : key;
    for (const [path, leaf] of flattenLeafValues(child, childPrefix)) result.set(path, leaf);
  }
  return result;
}
