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
    details: "Ensures the feature_flag_change_audits collection and its indexes for persisted old/new values, actor, reason, and revision. This is an audit-schema action; it does not change the current value of any feature flag.",
    id: "feature-flag-audit-v1",
    title: "Feature flag audit history"
  }
];

export function findDatabaseMaintenanceEntry(id: string): DatabaseMaintenanceEntry | null {
  return databaseMaintenanceEntries.find((entry) => entry.id === id) ?? null;
}
