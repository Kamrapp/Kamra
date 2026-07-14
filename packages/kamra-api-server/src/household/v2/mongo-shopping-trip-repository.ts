import type { MongoCollectionLike, MongoDatabaseLike } from "../../db/mongo-like.js";
import type { ApiPageRequest } from "../../http/pagination.js";
import type { ShoppingTrip } from "./stage9-contracts.js";

export class MongoShoppingTripRepository {
  private readonly trips: MongoCollectionLike<ShoppingTrip>;

  constructor(database: MongoDatabaseLike) {
    this.trips = database.collection("household_shopping_trips");
  }

  async setupCollections(): Promise<void> {
    await Promise.all([
      this.trips.createIndex(
        { id: 1 },
        { name: "household_shopping_trips_id_unique", unique: true }
      ),
      this.trips.createIndex(
        { householdId: 1, status: 1, updatedAt: -1 },
        { name: "household_shopping_trips_household_status" }
      ),
      this.trips.createIndex(
        { householdId: 1, sourceShoppingNeedListId: 1, status: 1 },
        { name: "household_shopping_trips_need_list" }
      )
    ]);
  }

  async get(householdId: string, id: string): Promise<ShoppingTrip | null> {
    return await this.trips.findOne({ householdId, id });
  }

  async list(householdId: string): Promise<ShoppingTrip[]> {
    return await this.trips.find({ householdId }).sort({ updatedAt: -1 }).toArray();
  }

  async listPage(
    householdId: string,
    page: ApiPageRequest
  ): Promise<{ hasNextPage: boolean; items: ShoppingTrip[] }> {
    const trips = await this.trips
      .find({ householdId })
      .sort({ updatedAt: -1, id: 1 })
      .skip(page.offset)
      .limit(page.pageSize + 1)
      .toArray();
    return {
      hasNextPage: trips.length > page.pageSize,
      items: trips.slice(0, page.pageSize)
    };
  }

  async create(trip: ShoppingTrip): Promise<ShoppingTrip> {
    const existing = await this.trips.findOne({ id: trip.id });
    if (existing) return existing;
    await this.trips.insertOne(trip);
    return trip;
  }

  async update(input: {
    expectedRevision: number;
    householdId: string;
    trip: ShoppingTrip;
  }): Promise<ShoppingTrip> {
    const result = await this.trips.updateOne(
      {
        householdId: input.householdId,
        id: input.trip.id,
        revision: input.expectedRevision
      },
      { $set: input.trip }
    );
    if (result.matchedCount !== 1) throw new Error("shopping_trip_revision_conflict");
    return input.trip;
  }

  async deleteCancelled(input: {
    expectedRevision: number;
    householdId: string;
    id: string;
  }): Promise<void> {
    const result = await this.trips.deleteMany({
      householdId: input.householdId,
      id: input.id,
      revision: input.expectedRevision
    });
    if (result.deletedCount !== 1) throw new Error("shopping_trip_revision_conflict");
  }
}
