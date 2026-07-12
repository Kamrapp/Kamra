import type { MongoCollectionLike, MongoDatabaseLike } from "../../db/mongo-like.js";
import type { ShoppingNeed, ShoppingNeedList } from "./contracts.js";
import { transitionShoppingNeed } from "./shopping-needs.js";

export class MongoShoppingNeedRepository {
  private readonly lists: MongoCollectionLike<ShoppingNeedList>;

  constructor(private readonly database: MongoDatabaseLike) {
    this.lists = database.collection("household_shopping_need_lists");
  }

  async setupCollections(): Promise<void> {
    await Promise.all([
      this.lists.createIndex(
        { id: 1 },
        { name: "household_shopping_need_lists_id_unique", unique: true }
      ),
      this.lists.createIndex(
        { householdId: 1 },
        { name: "household_shopping_need_lists_household_unique", unique: true }
      )
    ]);
  }

  async getOrCreateList(
    householdId: string,
    actorUserId: string,
    now: string
  ): Promise<ShoppingNeedList> {
    const existing = await this.lists.findOne({ householdId });
    if (existing) return existing;
    const list: ShoppingNeedList = {
      createdAt: now,
      createdByUserId: actorUserId,
      householdId,
      id: `shopping-needs:${householdId}`,
      items: [],
      updatedAt: now,
      updatedByUserId: actorUserId
    };
    await this.lists.insertOne(list);
    return list;
  }

  async upsertNeed(input: {
    actorUserId: string;
    householdId: string;
    need: ShoppingNeed;
    now: string;
  }): Promise<ShoppingNeedList> {
    const list = await this.getOrCreateList(input.householdId, input.actorUserId, input.now);
    const items = list.items.some((item) => item.id === input.need.id)
      ? list.items.map((item) => (item.id === input.need.id ? input.need : item))
      : [...list.items, input.need];
    const updated = { ...list, items, updatedAt: input.now, updatedByUserId: input.actorUserId };
    await this.lists.updateOne(
      { householdId: input.householdId },
      {
        $set: {
          items: updated.items,
          updatedAt: updated.updatedAt,
          updatedByUserId: updated.updatedByUserId
        }
      }
    );
    return updated;
  }

  async replaceGeneratedNeeds(input: {
    actorUserId: string;
    householdId: string;
    needs: ShoppingNeed[];
    now: string;
  }): Promise<ShoppingNeedList> {
    const list = await this.getOrCreateList(input.householdId, input.actorUserId, input.now);
    const manualItems = list.items.filter((item) => item.ownerKind === "manual");
    const updated = {
      ...list,
      items: [...manualItems, ...input.needs],
      updatedAt: input.now,
      updatedByUserId: input.actorUserId
    };
    await this.lists.updateOne(
      { householdId: input.householdId },
      {
        $set: {
          items: updated.items,
          updatedAt: updated.updatedAt,
          updatedByUserId: updated.updatedByUserId
        }
      }
    );
    return updated;
  }

  async transitionNeed(input: {
    actorUserId: string;
    expectedRevision: number;
    householdId: string;
    needId: string;
    now: string;
    state: ShoppingNeed["state"];
  }): Promise<ShoppingNeedList> {
    const list = await this.lists.findOne({ householdId: input.householdId });
    if (!list) throw new Error("shopping_need_list_not_found");
    const need = list.items.find((item) => item.id === input.needId);
    if (!need) throw new Error("shopping_need_not_found");
    const updatedNeed = transitionShoppingNeed(need, input.state, input.expectedRevision);
    const updated = {
      ...list,
      items: list.items.map((item) => (item.id === need.id ? updatedNeed : item)),
      updatedAt: input.now,
      updatedByUserId: input.actorUserId
    };
    await this.lists.updateOne(
      { householdId: input.householdId },
      {
        $set: {
          items: updated.items,
          updatedAt: updated.updatedAt,
          updatedByUserId: updated.updatedByUserId
        }
      }
    );
    return updated;
  }
}
