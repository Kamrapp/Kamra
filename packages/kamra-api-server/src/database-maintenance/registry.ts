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
  }
];

export function findDatabaseMaintenanceEntry(id: string): DatabaseMaintenanceEntry | null {
  return databaseMaintenanceEntries.find((entry) => entry.id === id) ?? null;
}
