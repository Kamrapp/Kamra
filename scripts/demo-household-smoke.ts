import { strict as assert } from "node:assert";

import { readAppConfig } from "../packages/kamra-api-server/src/config/app-config.js";
import {
  closeMongoClient,
  getMongoClient
} from "../packages/kamra-api-server/src/db/mongo-client.js";
import { writeServerLog } from "../packages/kamra-api-server/src/logging/kamra-logger.js";
import type { HouseholdRecord } from "../packages/kamra-api-server/src/household/v1/contracts.js";
import type {
  HouseholdProduct,
  ProductGroup,
  StockBatch
} from "../packages/kamra-api-server/src/household/v2/contracts.js";

const householdId = "household1";

async function runDemoHouseholdSmoke(): Promise<void> {
  const config = readAppConfig();
  if (!config.mongodb.uri || !config.mongodb.databaseName) {
    throw new Error("MongoDB configuration is required for demo household smoke validation.");
  }
  if (!/^kamra_(dev|test|smoke)$/.test(config.mongodb.databaseName)) {
    throw new Error(
      `Refusing to inspect database '${config.mongodb.databaseName}'. Use kamra_dev, kamra_test, or kamra_smoke.`
    );
  }

  const client = await getMongoClient(config.mongodb.uri, config.mongodb.dnsServers);
  const database = client.db(config.mongodb.databaseName);
  const [household, groups, products, batches] = await Promise.all([
    database.collection<HouseholdRecord>("households").findOne({ id: householdId }),
    database
      .collection<ProductGroup>("household_product_groups")
      .find({ householdId, status: "active" })
      .toArray(),
    database
      .collection<HouseholdProduct>("household_products")
      .find({ householdId, status: "active" })
      .toArray(),
    database
      .collection<StockBatch>("household_stock_batches")
      .find({ householdId, status: "available" })
      .toArray()
  ]);

  if (!household) {
    throw new Error(
      `Demo household ${householdId} is missing from database '${database.databaseName}'. Run npm run seed:demo-household first, then rerun npm run smoke:demo-household.`
    );
  }
  assert.equal(household.allowExpiredItems, true, "Demo household should allow expired items.");
  assert.equal(
    household.defaultCalculatedMaxLimitMultiplier,
    2,
    "Demo household should use the default max-limit multiplier of 2."
  );
  assert.equal(
    household.groupTargetShoppingMode,
    "add_products_and_group_item",
    "Demo household should use the default grouped shopping mode."
  );
  assert.equal(
    household.groupTargetShoppingDistributionMode,
    "split_evenly",
    "Demo household should use split-evenly grouped shopping by default."
  );

  const groupByName = new Map(groups.map((group) => [group.displayName, group]));
  for (const name of ["Tej", "Kenyér", "Zöldségek", "Gyümölcsök", "Ünnepi sütés"]) {
    assert.ok(groupByName.has(name), `Demo Product Group '${name}' is missing.`);
  }
  assert.ok(groupByName.get("Tej")?.targetPolicy, "Milk should have a group target policy.");
  assert.ok(groupByName.get("Kenyér")?.targetPolicy, "Bread should have a group target policy.");
  assert.equal(
    groupByName.get("Zöldségek")?.targetPolicy,
    null,
    "Vegetables should remain an untargeted group."
  );
  assert.equal(
    groupByName.get("Gyümölcsök")?.targetPolicy,
    null,
    "Fruit should remain an untargeted group."
  );
  assert.equal(
    groupByName.get("Ünnepi sütés")?.targetPolicy,
    null,
    "The empty demo group should remain untargeted."
  );
  assert.equal(
    groupByName.get("Gyümölcsök")?.groupTargetShoppingDistributionModeOverride,
    "latest",
    "Fruit should demonstrate a local latest-stocked Product strategy."
  );
  assert.ok(
    groups.every(
      (group) =>
        group.groupTargetShoppingModeOverride === "default" &&
        group.groupTargetShoppingDistributionModeOverride !== undefined
    ),
    "Every demo Product Group should expose explicit inherited shopping-policy defaults."
  );

  const productByName = new Map(products.map((product) => [product.displayName, product]));
  for (const name of [
    "Pilos 1.5% tej",
    "Mizo laktózmentes tej",
    "Fehér kenyér",
    "Rozskenyér",
    "Paradicsom",
    "Uborka",
    "Padlizsán",
    "Alma",
    "Kiwi",
    "Áfonya",
    "Pelenka",
    "Mosogatószivacs",
    "Öblítő"
  ]) {
    assert.ok(productByName.has(name), `Demo Household Product '${name}' is missing.`);
  }

  const productIds = new Set(
    products.map((product) => product.id).filter((id): id is string => typeof id === "string")
  );
  const currentDate = today();
  assert.ok(
    products.some((product) => product.productGroupId === null),
    "The demo must include unassigned Products."
  );
  assert.ok(
    products.some((product) => product.productGroupId !== null),
    "The demo must include grouped Products."
  );
  assert.ok(
    batches.some((batch) => typeof batch.expiryOn === "string" && batch.expiryOn < currentDate),
    "The demo must include an expired Batch."
  );
  assert.ok(
    batches.some((batch) => typeof batch.expiryOn === "string" && batch.expiryOn > currentDate),
    "The demo must include a future-expiring Batch."
  );
  assert.ok(
    batches.some((batch) => batch.expiryOn === null || batch.expiryOn === undefined),
    "The demo must include a no-expiry Batch."
  );

  for (const batch of batches) {
    if (typeof batch.householdProductId !== "string") {
      throw new Error(`Batch ${batch.id} has no Household Product owner.`);
    }
    assert.ok(
      productIds.has(batch.householdProductId),
      `Batch ${batch.id} has no existing Household Product owner.`
    );
  }

  const batchesByProductId = new Map<string, StockBatch[]>();
  for (const batch of batches) {
    if (typeof batch.householdProductId !== "string") {
      continue;
    }
    const productBatches = batchesByProductId.get(batch.householdProductId) ?? [];
    productBatches.push(batch);
    batchesByProductId.set(batch.householdProductId, productBatches);
  }
  const productIdByName = (name: string): string => {
    const id = productByName.get(name)?.id;
    if (typeof id !== "string") {
      throw new Error(`Demo Household Product '${name}' has no id.`);
    }
    return id;
  };
  assert.ok(
    (batchesByProductId.get(productIdByName("Pilos 1.5% tej")) ?? []).length >= 1,
    "Pilos milk should have a seeded Batch."
  );
  assert.ok(
    (batchesByProductId.get(productIdByName("Mizo laktózmentes tej")) ?? []).length >= 2,
    "Mizo milk should have multiple seeded Batches."
  );
  assert.ok(
    (batchesByProductId.get(productIdByName("Fehér kenyér")) ?? []).length >= 2,
    "White bread should have multiple seeded Batches."
  );

  writeServerLog("info", "Demo household smoke validation completed", {
    batchCount: batches.length,
    databaseName: database.databaseName,
    groupCount: groups.length,
    householdId,
    productCount: products.length
  });
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

try {
  await runDemoHouseholdSmoke();
} catch (error) {
  writeServerLog("error", "Demo household smoke validation failed", error);
  process.exitCode = 1;
} finally {
  await closeMongoClient();
}
