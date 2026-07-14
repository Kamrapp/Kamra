import type { MongoCollectionLike, MongoDatabaseLike } from "../../db/mongo-like.js";
import type { ShopMarket } from "./contracts.js";

export class MongoShopMarketRepository {
  private readonly markets: MongoCollectionLike<ShopMarket>;

  constructor(database: MongoDatabaseLike) {
    this.markets = database.collection("shop_markets");
  }

  async setupCollections(): Promise<void> {
    await Promise.all([
      this.markets.createIndex({ id: 1 }, { name: "shop_markets_id_unique", unique: true }),
      this.markets.createIndex(
        { countryCode: 1, aliases: 1, status: 1 },
        { name: "shop_markets_country_alias_status" }
      )
    ]);
  }

  async create(market: ShopMarket): Promise<ShopMarket> {
    await this.markets.insertOne(market);
    return market;
  }

  async get(id: string): Promise<ShopMarket | null> {
    return await this.markets.findOne({ id, status: "active" });
  }

  async list(countryCode?: string): Promise<ShopMarket[]> {
    return await this.markets
      .find(countryCode ? { countryCode, status: "active" } : { status: "active" })
      .sort({ displayName: 1 })
      .toArray();
  }
}
