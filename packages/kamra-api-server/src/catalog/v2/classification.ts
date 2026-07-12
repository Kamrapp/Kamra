import type { ProductTagAssignmentRecord, ProductTagRecord } from "../v1/contracts.js";
import type {
  ProductAttributeRef,
  ProductConceptRef,
  ProductConceptRelation
} from "../../household/v2/contracts.js";

export interface ProductConceptRecord {
  createdAt: string;
  id: string;
  key: string;
  label: string;
  origin: ProductTagRecord["origin"];
  seedChecksum?: string;
  seedPackId?: string;
  translations?: Record<string, string>;
  status: "active" | "archived";
  updatedAt: string;
}
export type ProductAttributeRecord = ProductConceptRecord;
export interface ProductConceptAssignmentRecord {
  assignedAt: string;
  id: string;
  origin: ProductTagAssignmentRecord["origin"];
  productId: string;
  concept: ProductConceptRef;
}
export interface ProductAttributeAssignmentRecord {
  assignedAt: string;
  id: string;
  origin: ProductTagAssignmentRecord["origin"];
  productId: string;
  attribute: ProductAttributeRef;
}

export interface ClassificationMigrationResult {
  attributes: ProductAttributeRecord[];
  attributeAssignments: ProductAttributeAssignmentRecord[];
  conceptAssignments: ProductConceptAssignmentRecord[];
  concepts: ProductConceptRecord[];
  discardedKeywordCount: number;
  relations: ProductConceptRelation[];
  skippedAssignmentCount: number;
  skippedRelationCount: number;
}

export function migrateLegacyClassification(
  tags: readonly ProductTagRecord[],
  assignments: readonly ProductTagAssignmentRecord[]
): ClassificationMigrationResult {
  const categoryKeys = new Set(tags.filter((tag) => tag.kind === "category").map((tag) => tag.key));
  const concepts = tags
    .filter((tag) => tag.kind === "category")
    .map((tag) => ({
      createdAt: tag.createdAt,
      id: `concept:${tag.key}`,
      key: tag.key,
      label: tag.label,
      origin: tag.origin,
      status: tag.status,
      updatedAt: tag.updatedAt
    }));
  const attributes = tags
    .filter((tag) => tag.kind === "attribute")
    .map((tag) => ({
      createdAt: tag.createdAt,
      id: `attribute:${tag.key}`,
      key: tag.key,
      label: tag.label,
      origin: tag.origin,
      status: tag.status,
      updatedAt: tag.updatedAt
    }));
  const relations: ProductConceptRelation[] = [];
  let skippedRelationCount = 0;
  for (const tag of tags.filter(
    (candidate) => candidate.kind === "category" && candidate.parentKey
  )) {
    if (!categoryKeys.has(tag.parentKey!)) {
      skippedRelationCount += 1;
      continue;
    }
    if (tag.parentKey === tag.key) {
      skippedRelationCount += 1;
      continue;
    }
    relations.push({
      child: { key: tag.key, scope: "catalog" },
      kind: "is_a",
      parent: { key: tag.parentKey!, scope: "catalog" }
    });
  }
  const conceptAssignments: ProductConceptAssignmentRecord[] = [];
  const attributeAssignments: ProductAttributeAssignmentRecord[] = [];
  let discardedKeywordCount = 0;
  let skippedAssignmentCount = 0;
  for (const assignment of assignments) {
    const tag = tags.find((candidate) => candidate.key === assignment.tagKey);
    if (!tag) {
      skippedAssignmentCount += 1;
      continue;
    }
    if (tag.kind === "category")
      conceptAssignments.push({
        assignedAt: assignment.assignedAt,
        id: `concept-assignment:${assignment.productId}:${tag.key}`,
        origin: assignment.origin,
        productId: assignment.productId,
        concept: { key: tag.key, scope: "catalog" }
      });
    else if (tag.kind === "attribute")
      attributeAssignments.push({
        assignedAt: assignment.assignedAt,
        id: `attribute-assignment:${assignment.productId}:${tag.key}`,
        origin: assignment.origin,
        productId: assignment.productId,
        attribute: { key: tag.key, scope: "catalog" }
      });
    else discardedKeywordCount += 1;
  }
  return {
    attributes,
    attributeAssignments,
    conceptAssignments,
    concepts,
    discardedKeywordCount,
    relations,
    skippedAssignmentCount,
    skippedRelationCount
  };
}
