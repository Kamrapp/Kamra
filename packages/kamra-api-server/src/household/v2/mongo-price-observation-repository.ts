import type { MongoCollectionLike, MongoDatabaseLike } from "../../db/mongo-like.js";
import type { PriceObservationCandidate } from "./stage9-contracts.js";

const priceObservationValidator = {
  additionalProperties: false,
  bsonType: "object",
  properties: {
    _id: { bsonType: "objectId" },
    currencyCode: { bsonType: "string" },
    id: { bsonType: "string" },
    kind: { enum: ["base", "offer", "coupon", "loyalty_card", "purchase_paid"] },
    observedAt: { bsonType: "string" },
    price: { bsonType: "number", minimum: 0 },
    shopProductId: { bsonType: "string" },
    supersededByObservationId: { bsonType: ["null", "string"] },
    validFrom: { bsonType: ["null", "string"] },
    validTo: { bsonType: ["null", "string"] }
  },
  required: ["currencyCode", "id", "kind", "observedAt", "price", "shopProductId"]
};

export class MongoPriceObservationRepository {
  private readonly database: MongoDatabaseLike;
  private readonly observations: MongoCollectionLike<PriceObservationCandidate>;
  private readonly legacyObservations: MongoCollectionLike<PriceObservationCandidate>;

  constructor(database: MongoDatabaseLike) {
    this.database = database;
    this.observations = database.collection("shop_price_observations");
    this.legacyObservations = database.collection("price_observations");
  }

  async setupCollections(): Promise<void> {
    await Promise.all([
      this.observations.createIndex(
        { id: 1 },
        { name: "shop_price_observations_id_unique", unique: true }
      ),
      this.observations.createIndex(
        { shopProductId: 1, observedAt: -1 },
        { name: "shop_price_observations_shop_product_date" }
      )
    ]);
  }

  async upgradeValidator(): Promise<{
    createdCollections: string[];
    databaseName: string;
    upgradedCollections: string[];
  }> {
    const collectionName = "shop_price_observations";
    const existingCollections = new Set(
      (await this.database.listCollections({}, { nameOnly: true }).toArray()).map(
        (entry) => entry.name
      )
    );
    const createdCollections: string[] = [];
    const upgradedCollections: string[] = [];

    if (!existingCollections.has(collectionName)) {
      await this.database.createCollection(collectionName, {
        validationAction: "error",
        validationLevel: "strict",
        validator: { $jsonSchema: priceObservationValidator }
      });
      createdCollections.push(collectionName);
    } else {
      await this.database.command({
        collMod: collectionName,
        validationAction: "error",
        validationLevel: "strict",
        validator: { $jsonSchema: priceObservationValidator }
      });
      upgradedCollections.push(collectionName);
    }

    await this.setupCollections();

    return {
      createdCollections,
      databaseName: this.database.databaseName,
      upgradedCollections
    };
  }

  async migrateLegacy(): Promise<{
    migratedCount: number;
    preservedHistory: true;
    status: "ready";
  }> {
    let migratedCount = 0;
    const legacyDocuments = await this.legacyObservations.find({}).toArray();

    for (const legacyDocument of legacyDocuments) {
      const observation = toStage9Observation(legacyDocument);
      if (!observation || (await this.observations.findOne({ id: observation.id }))) continue;

      await this.observations.insertOne(observation);
      migratedCount += 1;
    }

    return { migratedCount, preservedHistory: true, status: "ready" };
  }

  async append(observation: PriceObservationCandidate): Promise<PriceObservationCandidate> {
    if (observation.price < 0 || !Number.isFinite(observation.price))
      throw new Error("invalid_price_observation");
    await this.observations.insertOne(observation);
    return observation;
  }

  async list(shopProductId: string): Promise<PriceObservationCandidate[]> {
    return await this.observations
      .find({ shopProductId })
      .sort({ observedAt: -1, id: 1 })
      .toArray();
  }
}

function toStage9Observation(value: PriceObservationCandidate): PriceObservationCandidate | null {
  const allowedKinds = ["base", "offer", "coupon", "loyalty_card", "purchase_paid"] as const;
  if (
    typeof value.id !== "string" ||
    typeof value.shopProductId !== "string" ||
    typeof value.currencyCode !== "string" ||
    typeof value.observedAt !== "string" ||
    typeof value.price !== "number" ||
    !Number.isFinite(value.price) ||
    value.price < 0 ||
    !allowedKinds.includes(value.kind)
  ) {
    return null;
  }

  return {
    currencyCode: value.currencyCode,
    id: value.id,
    kind: value.kind,
    observedAt: value.observedAt,
    price: value.price,
    shopProductId: value.shopProductId,
    ...(value.supersededByObservationId === undefined
      ? {}
      : { supersededByObservationId: value.supersededByObservationId }),
    ...(value.validFrom === undefined ? {} : { validFrom: value.validFrom }),
    ...(value.validTo === undefined ? {} : { validTo: value.validTo })
  };
}
