import type { MongoCollectionLike, MongoDatabaseLike } from "../../db/mongo-like.js";
import type { PriceObservationCandidate } from "./stage9-contracts.js";

export class MongoPriceObservationRepository {
  private readonly observations: MongoCollectionLike<PriceObservationCandidate>;

  constructor(database: MongoDatabaseLike) {
    this.observations = database.collection("price_observations");
  }

  async setupCollections(): Promise<void> {
    await Promise.all([
      this.observations.createIndex(
        { id: 1 },
        { name: "price_observations_id_unique", unique: true }
      ),
      this.observations.createIndex(
        { shopProductId: 1, observedAt: -1 },
        { name: "price_observations_shop_product_date" }
      )
    ]);
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
