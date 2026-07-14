import basePack from "./base-classification.v1.json";
import en from "./i18n/en.json";
import hu from "./i18n/hu.json";
import { validateConceptRelations } from "../../household/v2/domain.js";
import type { AcceptanceCriteria, TrackingUnit } from "../../household/v2/contracts.js";

export interface BaseClassificationPack {
  attributes: Array<{ key: string }>;
  concepts: Array<{ key: string; parentKey: string | null }>;
  labels: Record<"en" | "hu", Record<string, string>>;
  packId: string;
  stockTargetTemplates: Array<{
    acceptanceCriteria: AcceptanceCriteria;
    key: string;
    minimumQuantity: number;
    targetQuantity: number;
    trackingUnit: TrackingUnit;
  }>;
  version: number;
}

export function loadBaseClassificationPack(): BaseClassificationPack {
  const conceptKeys = new Set(basePack.concepts.map((concept) => concept.key));
  const relations = basePack.concepts
    .filter((concept) => concept.parentKey)
    .map((concept) => ({
      child: { key: concept.key, scope: "catalog" as const },
      kind: "is_a" as const,
      parent: { key: concept.parentKey!, scope: "catalog" as const }
    }));
  for (const relation of relations)
    if (!conceptKeys.has(relation.parent.key))
      throw new Error(`base classification parent is missing: ${relation.parent.key}`);
  validateConceptRelations(relations);
  const labels = { en: en as Record<string, string>, hu: hu as Record<string, string> };
  const requiredIds = [
    ...basePack.concepts.map((item) => item.key),
    ...basePack.attributes.map((item) => item.key),
    ...basePack.stockTargetTemplates.map((item) => `template.${item.key}`)
  ];
  for (const locale of ["en", "hu"] as const)
    for (const id of requiredIds)
      if (!labels[locale][id])
        throw new Error(`base classification translation is missing: ${locale}:${id}`);
  return {
    attributes: basePack.attributes,
    concepts: basePack.concepts,
    labels,
    packId: basePack.packId,
    stockTargetTemplates: basePack.stockTargetTemplates.map((template) => ({
      acceptanceCriteria: {
        acceptedAttributesAny: [],
        acceptedConceptsAny:
          template.acceptedConceptsAny?.map((key) => ({ key, scope: "catalog" as const })) ?? [],
        excludedAttributesAny: [],
        requiredAttributesAll:
          template.requiredAttributesAll?.map((key) => ({ key, scope: "catalog" as const })) ?? [],
        requiredConceptsAll: template.requiredConceptsAll.map((key) => ({
          key,
          scope: "catalog" as const
        }))
      },
      key: template.key,
      minimumQuantity: template.minimumQuantity,
      targetQuantity: template.targetQuantity,
      trackingUnit: template.trackingUnit as TrackingUnit
    })),
    version: basePack.version
  };
}
