import type { MongoCollectionLike, MongoDatabaseLike } from "../../db/mongo-like.js";
import type { ShopProductRecord } from "./stage9-contracts.js";

export class MongoShopProductRepository {
  private readonly products: MongoCollectionLike<ShopProductRecord>;

  constructor(database: MongoDatabaseLike) {
    this.products = database.collection("shop_products");
  }

  async setupCollections(): Promise<void> {
    await Promise.all([
      this.products.createIndex({ id: 1 }, { name: "shop_products_id_unique", unique: true }),
      this.products.createIndex(
        { shopMarketId: 1, productId: 1, status: 1 },
        { name: "shop_products_market_product" }
      ),
      this.products.createIndex(
        { shopMarketId: 1, displayName: 1, status: 1 },
        { name: "shop_products_market_name" }
      )
    ]);
  }

  async create(product: ShopProductRecord): Promise<ShopProductRecord> {
    await this.products.insertOne(product);
    return product;
  }

  async get(id: string): Promise<ShopProductRecord | null> {
    return await this.products.findOne({ id });
  }

  async list(shopMarketId: string, nameIncludes?: string): Promise<ShopProductRecord[]> {
    const products = await this.products
      .find({ shopMarketId, status: "active" })
      .sort({ displayName: 1 })
      .toArray();
    const needle = nameIncludes?.trim().toLocaleLowerCase();
    return needle
      ? products.filter((product) => product.displayName.toLocaleLowerCase().includes(needle))
      : products;
  }
}
