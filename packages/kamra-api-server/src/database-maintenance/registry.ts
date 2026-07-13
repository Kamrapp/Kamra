export interface DatabaseMaintenanceEntry {
  details: string;
  id: string;
  title: string;
}

export const databaseMaintenanceEntries: readonly DatabaseMaintenanceEntry[] = [
  {
    details:
      "Runs the final Product Group cutover in the required order by composing the existing stock, Household Product, and Product Group migrations. It preserves legacy household collections for rollback evidence, reports migration counts and Product Group conflicts, and does not touch raw Crawl Snapshot collections. Run the validator action first, then the migration action; resolve reported conflicts before treating the cutover as complete.",
    id: "alpha-domain-language-v1",
    title: "Alpha final domain language cutover"
  },
  {
    details:
      "Updates the JSON Schema validators for all catalog collections to the current catalog contract. This changes which future catalog writes MongoDB accepts; it does not add missing fields to existing product documents. Run the migration action afterwards to backfill legacy validation fields.",
    id: "catalog-product-validation",
    title: "Catalog product validation fields"
  },
  {
    details:
      "Updates the JSON Schema validators for all household collections to the current household contract. This changes future household writes; it does not rewrite existing households. Run the migration action afterwards to add missing defaultCalculatedMaxLimitMultiplier and favouriteShopId fields.",
    id: "household-fields",
    title: "Household default fields"
  },
  {
    details:
      "Adds the allowExpiredItems household policy field to the household validator and backfills existing households with the permissive true default. This is separate from the original household default-field maintenance action because its completion may already be recorded.",
    id: "household-expired-item-policy-v1",
    title: "Household expired-item policy"
  },
  {
    details:
      "Adds the grouped-target shopping mode to the household validator and backfills existing households with the default that adds Product needs first and a Group impulse item only when no Product can represent the shortage.",
    id: "household-group-shopping-policy-v1",
    title: "Household grouped-target shopping policy"
  },
  {
    details:
      "Adds the group-target quantity distribution policy to the household validator and backfills existing households to deterministic even distribution. The migration is separate from the validator update and does not rewrite shopping history.",
    id: "household-group-shopping-distribution-v1",
    title: "Household grouped-target distribution policy"
  },
  {
    details:
      "Creates the pending household invitation collection and indexes used by the small no-email membership flow. The validator action changes accepted invitation documents; the migration action is acknowledgement-only because invitations have no legacy source data.",
    id: "household-invitations-v1",
    title: "Household invitations"
  },
  {
    details:
      "Creates the final Product Concept, Product Attribute, relation, and product-classification assignment collections and migrates legacy category/attribute tags without treating keyword hints as eligibility rules.",
    id: "catalog-classification-v1",
    title: "Catalog product classification"
  },
  {
    details:
      "Creates the Stage 8 Stock Target, Stock Batch, Stock Allocation, and Stock Movement collections and migrates legacy household rows into unconstrained targets, opening-balance batches, explicit allocations, and history.",
    id: "household-stock-targets-v1",
    title: "Household stock targets and batches"
  },
  {
    details:
      "Creates the reusable household product anchor collection used to group concrete products across batches, and links legacy household product rows to migrated stock batches without rewriting historical batch snapshots.",
    id: "household-products-v1",
    title: "Household product anchors"
  },
  {
    details:
      "Creates Product Group indexes and target-policy-compatible fields for direct Household Product membership. The validator action changes accepted future shapes; the migration action reconciles legacy Stock Targets/Allocations into Product Groups, links unambiguous Products, reports conflicting histories, and preserves legacy allocation/movement evidence.",
    id: "household-product-groups-v1",
    title: "Household Product Groups and target policies"
  },
  {
    details:
      "Creates household-local Product Concept indexes. Existing Product classification remains unchanged; this action only enables additive household-owned concept vocabulary.",
    id: "household-local-classification-v1",
    title: "Household Product Concepts"
  },
  {
    details:
      "Creates the direct country-specific Shop Market, Shopping Need, Shopping Trip, and Ingestion Submission foundation collections and indexes. Shopping Trips may also store an optional custom shop-name snapshot when no configured market exists; older documents remain valid and need no backfill. This is separate from legacy household shop labels and does not migrate or delete historical shopping lists.",
    id: "shopping-trip-foundation-v1",
    title: "Shop Markets and Shopping Trips"
  },
  {
    details:
      "Creates the Shop Product indexes needed by the Stage 9 matching path. Validator and existing-data applicability migration remain separate operator actions; this entry does not own catalogue price history.",
    id: "shop-product-price-foundation-v1",
    title: "Shop Product indexes"
  },
  {
    details:
      "Creates and validates the Stage 9 append-only Shop Price Observation collection. The migration copies only legacy Stage 9-shaped documents out of the catalogue-owned price_observations collection, preserves the original history, and skips catalogue-shaped records.",
    id: "shop-price-observations-v1",
    title: "Shop Price Observations"
  },
  {
    details:
      "Ensures the feature_flag_change_audits collection and its indexes for persisted old/new values, actor, reason, and revision. This is an audit-schema action; it does not change the current value of any feature flag.",
    id: "feature-flag-audit-v1",
    title: "Feature flag audit history"
  },
  {
    details:
      "Adds the optional revision field to the shared household feature-flag validator so revision-aware admin flag writes are accepted. Existing V1 flag documents remain valid and no data backfill is required.",
    id: "feature-flag-revision-v1",
    title: "Feature flag revision compatibility"
  }
];

export function findDatabaseMaintenanceEntry(id: string): DatabaseMaintenanceEntry | null {
  return databaseMaintenanceEntries.find((entry) => entry.id === id) ?? null;
}
