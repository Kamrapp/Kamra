export interface DatabaseMaintenanceEntry {
  details: string;
  id: string;
  title: string;
}

export const databaseMaintenanceEntries: readonly DatabaseMaintenanceEntry[] = [
  {
    details: "Updates the JSON Schema validators for all catalog collections to the current catalog contract. This changes which future catalog writes MongoDB accepts; it does not add missing fields to existing product documents. Run the migration action afterwards to backfill legacy validation fields.",
    id: "catalog-product-validation",
    title: "Catalog product validation fields"
  },
  {
    details: "Updates the JSON Schema validators for all household collections to the current household contract. This changes future household writes; it does not rewrite existing households. Run the migration action afterwards to add missing defaultCalculatedMaxLimitMultiplier and favouriteShopId fields.",
    id: "household-fields",
    title: "Household default fields"
  },
  {
    details: "Adds the allowExpiredItems household policy field to the household validator and backfills existing households with the permissive true default. This is separate from the original household default-field maintenance action because its completion may already be recorded.",
    id: "household-expired-item-policy-v1",
    title: "Household expired-item policy"
  },
  {
    details: "Creates the final Product Concept, Product Attribute, relation, and product-classification assignment collections and migrates legacy category/attribute tags without treating keyword hints as eligibility rules.",
    id: "catalog-classification-v1",
    title: "Catalog product classification"
  },
  {
    details: "Creates the Stage 8 Stock Target, Stock Batch, Stock Allocation, and Stock Movement collections and migrates legacy household rows into unconstrained targets, opening-balance batches, explicit allocations, and history.",
    id: "household-stock-targets-v1",
    title: "Household stock targets and batches"
  },
  {
    details: "Creates the reusable household product anchor collection used to group concrete products across batches, and links legacy household product rows to migrated stock batches without rewriting historical batch snapshots.",
    id: "household-products-v1",
    title: "Household product anchors"
  },
  {
    details: "Creates Product Group indexes and target-policy-compatible fields for direct Household Product membership. The validator action changes accepted future shapes; the migration action reconciles legacy Stock Targets/Allocations into Product Groups, links unambiguous Products, reports conflicting histories, and preserves legacy allocation/movement evidence.",
    id: "household-product-groups-v1",
    title: "Household Product Groups and target policies"
  },
  {
    details: "Creates household-local Product Concept indexes. Existing Product classification remains unchanged; this action only enables additive household-owned concept vocabulary.",
    id: "household-local-classification-v1",
    title: "Household Product Concepts"
  },
  {
    details: "Ensures the feature_flag_change_audits collection and its indexes for persisted old/new values, actor, reason, and revision. This is an audit-schema action; it does not change the current value of any feature flag.",
    id: "feature-flag-audit-v1",
    title: "Feature flag audit history"
  }
];

export function findDatabaseMaintenanceEntry(id: string): DatabaseMaintenanceEntry | null {
  return databaseMaintenanceEntries.find((entry) => entry.id === id) ?? null;
}
