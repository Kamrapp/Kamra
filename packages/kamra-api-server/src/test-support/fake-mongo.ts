/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any */
import type { AnyBulkWriteOperation, DeleteResult, Document, Filter as MongoFilter, OptionalUnlessRequiredId } from "mongodb";

import type { MongoCollectionLike, MongoCursorLike, MongoDatabaseLike, MongoWriteResult } from "../db/mongo-like.js";

type PlainDoc = Record<string, unknown>;

type Update = {
  $set?: Record<string, unknown>;
  $unset?: Record<string, unknown>;
  $setOnInsert?: Record<string, unknown>;
  [operator: string]: unknown;
};

export class FakeCollection<T extends PlainDoc = PlainDoc> implements MongoCollectionLike<T> {
  readonly docs: T[];

  constructor(
    readonly name: string,
    initialDocs: T[] = []
  ) {
    this.docs = initialDocs.map((doc) => structuredClone(doc));
  }

  async bulkWrite(operations: AnyBulkWriteOperation<T>[]): Promise<unknown> {
    for (const operation of operations) {
      const replaceOne = "replaceOne" in operation ? operation.replaceOne : null;
      if (!replaceOne) {
        continue;
      }

      const index = this.docs.findIndex((doc) => matchesFilter(doc, replaceOne.filter as MongoFilter<PlainDoc>));
      if (index >= 0) {
        this.docs[index] = structuredClone(replaceOne.replacement) as T;
      } else if (replaceOne.upsert) {
        this.docs.push(structuredClone(replaceOne.replacement) as T);
      }
    }

    return {
      acknowledged: true
    };
  }

  async countDocuments(filter: MongoFilter<T> = {} as MongoFilter<T>, _options?: { limit?: number }): Promise<number> {
    return this.docs.filter((doc) => matchesFilter(doc, filter)).length;
  }

  async createIndex(_index: Record<string, 1 | -1>, _options?: Record<string, unknown>): Promise<string> {
    return `${this.name}_index`;
  }

  async deleteMany(filter: MongoFilter<T> = {} as MongoFilter<T>): Promise<DeleteResult> {
    const nextDocs = this.docs.filter((doc) => !matchesFilter(doc, filter));
    const deletedCount = this.docs.length - nextDocs.length;
    this.docs.splice(0, this.docs.length, ...nextDocs);

    return {
      acknowledged: true,
      deletedCount
    };
  }

  async drop(): Promise<boolean> {
    this.docs.splice(0, this.docs.length);
    return true;
  }

  distinct(key: string, filter: MongoFilter<T> = {} as MongoFilter<T>): Promise<unknown[]> {
    const values = this.docs
      .filter((doc) => matchesFilter(doc, filter))
      .map((doc) => getValue(doc, key))
      .filter((value, index, array) => array.findIndex((candidate) => candidate === value) === index);

    return Promise.resolve(values);
  }

  find(filter: MongoFilter<T> = {} as MongoFilter<T>, _options?: Document): FakeCursor<T> {
    return new FakeCursor<T>(this.docs.filter((doc) => matchesFilter(doc, filter)) as T[]);
  }

  async findOne(filter: MongoFilter<T> = {} as MongoFilter<T>): Promise<T | null> {
    return (this.docs.find((doc) => matchesFilter(doc, filter)) ?? null) as T | null;
  }

  async insertOne(doc: OptionalUnlessRequiredId<T>): Promise<unknown> {
    const copy = structuredClone(doc) as T;
    this.docs.push(copy);

    return {
      acknowledged: true,
      insertedId: (copy as PlainDoc)["id"] ?? null
    };
  }

  async updateMany(filter: MongoFilter<T>, update: Document, options?: Document): Promise<MongoWriteResult> {
    return this.applyUpdate(filter, update, true, options);
  }

  async updateOne(filter: MongoFilter<T>, update: Document, options?: Document): Promise<MongoWriteResult> {
    return this.applyUpdate(filter, update, false, options);
  }

  private applyUpdate(
    filter: MongoFilter<T>,
    update: Document,
    many: boolean,
    options?: Document
  ): MongoWriteResult {
    let matchedCount = 0;
    let modifiedCount = 0;

    for (const doc of this.docs) {
      if (!matchesFilter(doc, filter)) {
        continue;
      }

      matchedCount += 1;
      applyUpdateToDocument(doc, update as Update);
      modifiedCount += 1;

      if (!many) {
        break;
      }
    }

    if (matchedCount === 0 && options?.["upsert"]) {
      const replacement = {} as T;
      applyUpdateToDocument(replacement, update as Update);
      applyUpdateToDocument(replacement, filter as unknown as Update);
      this.docs.push(replacement);
    }

    return {
      acknowledged: true,
      matchedCount,
      modifiedCount
    };
  }
}

export class FakeCursor<T extends PlainDoc = PlainDoc> implements MongoCursorLike<T> {
  private docs: T[];

  constructor(docs: T[]) {
    this.docs = docs.map((doc) => structuredClone(doc));
  }

  limit(count: number): FakeCursor<T> {
    if (count > 0) {
      this.docs = this.docs.slice(0, count);
    }

    return this;
  }

  skip(count: number): FakeCursor<T> {
    if (count > 0) {
      this.docs = this.docs.slice(count);
    }

    return this;
  }

  sort(sortSpec: Record<string, 1 | -1>): FakeCursor<T> {
    const [field, direction] = Object.entries(sortSpec)[0] ?? [];

    if (field) {
      this.docs.sort((left, right) =>
        compareValues(getValue(left, field), getValue(right, field), direction === -1 ? -1 : 1)
      );
    }

    return this;
  }

  async toArray(): Promise<T[]> {
    return this.docs.map((doc) => structuredClone(doc));
  }
}

export function createFakeDb(collections: Record<string, FakeCollection<any>> = {}): MongoDatabaseLike & {
  __collections: Record<string, FakeCollection<any>>;
} {
  const state: Record<string, FakeCollection<any>> = collections;

  return {
    __collections: state,
    databaseName: "fake_db",

    collection<T extends PlainDoc = PlainDoc>(name: string): FakeCollection<T> {
      if (!state[name]) {
        state[name] = new FakeCollection(name);
      }

      return state[name] as FakeCollection<T>;
    },

    async createCollection<T extends PlainDoc = PlainDoc>(
      name: string,
      _options?: Document
    ): Promise<FakeCollection<T>> {
      if (!state[name]) {
        state[name] = new FakeCollection(name);
      }

      return state[name] as FakeCollection<T>;
    },

    async command(_command: Document): Promise<Document> {
      return { ok: 1 };
    },

    listCollections(_filter?: Document, _options?: Document) {
      return {
        toArray: async () => Object.keys(state).map((name) => ({ name }))
      };
    }
  };
}

function matchesFilter(doc: PlainDoc, filter: MongoFilter<any>): boolean {
  if (Array.isArray(filter.$or)) {
    return filter.$or.some((branch) => matchesFilter(doc, branch));
  }

  return Object.entries(filter).every(([key, condition]) => {
    if (key.startsWith("$")) {
      return true;
    }

    const value = getValue(doc, key);

    if (isPlainDoc(condition)) {
      if ("$in" in condition && Array.isArray(condition["$in"])) {
        return condition["$in"].includes(value);
      }

      if ("$exists" in condition) {
        return condition["$exists"] ? value !== undefined : value === undefined;
      }

      return Object.entries(condition).every(([nestedKey, nestedValue]) => {
        if (nestedKey.startsWith("$")) {
          return true;
        }

        return getValue(doc, `${key}.${nestedKey}`) === nestedValue;
      });
    }

    return value === condition;
  });
}

function applyUpdateToDocument(doc: PlainDoc, update: Update): void {
  if (isPlainDoc(update.$set)) {
    for (const [key, value] of Object.entries(update.$set)) {
      setValue(doc, key, value);
    }
  }

  if (isPlainDoc(update.$setOnInsert)) {
    for (const [key, value] of Object.entries(update.$setOnInsert)) {
      setValue(doc, key, value);
    }
  }

  if (isPlainDoc(update.$unset)) {
    for (const key of Object.keys(update.$unset)) {
      deletePath(doc, key);
    }
  }
}

function isPlainDoc(value: unknown): value is PlainDoc {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function compareValues(left: unknown, right: unknown, direction: 1 | -1): number {
  const leftText = left === undefined || left === null ? "" : String(left);
  const rightText = right === undefined || right === null ? "" : String(right);
  return leftText.localeCompare(rightText, "hu-HU") * direction;
}

function deletePath(target: PlainDoc, path: string): void {
  const parts = path.split(".");
  const last = parts.pop();

  if (!last) {
    return;
  }

  let current: PlainDoc = target;

  for (const part of parts) {
    const next = current[part];

    if (!isPlainDoc(next)) {
      return;
    }

    current = next;
  }

  delete current[last];
}

function getValue(target: PlainDoc, path: string): unknown {
  return path.split(".").reduce<unknown>((current, part) => {
    if (!isPlainDoc(current)) {
      return undefined;
    }

    return current[part];
  }, target);
}

function setValue(target: PlainDoc, path: string, value: unknown): void {
  const parts = path.split(".");
  const last = parts.pop();

  if (!last) {
    return;
  }

  let current: PlainDoc = target;

  for (const part of parts) {
    const next = current[part];

    if (!isPlainDoc(next)) {
      current[part] = {};
    }

    current = current[part] as PlainDoc;
  }

  current[last] = value;
}
