import { describe, expect, it } from "vitest";
import { loadBaseClassificationPack } from "./loader.js";

describe("base classification pack", () => {
  it("loads a cycle-free bilingual pack with stable template criteria", () => {
    const pack = loadBaseClassificationPack();
    expect(pack.concepts).toHaveLength(9); expect(pack.attributes).toHaveLength(3); expect(pack.stockTargetTemplates).toHaveLength(3);
    expect(pack.labels.en["food.pasta.spaghetti"]).toBe("Spaghetti"); expect(pack.labels.hu["food.pasta.spaghetti"]).toBe("Spagetti");
    expect(pack.stockTargetTemplates[1]?.acceptanceCriteria.requiredConceptsAll[0]).toEqual({ key: "food.pasta", scope: "catalog" });
  });
});
