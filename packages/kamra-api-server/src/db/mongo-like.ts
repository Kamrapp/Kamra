import type {
  AnyBulkWriteOperation,
  DeleteResult,
  Document,
  Filter,
  OptionalUnlessRequiredId
} from "mongodb";

export interface MongoCursorLike<T> {
  limit(count: number): MongoCursorLike<T>;
  skip(count: number): MongoCursorLike<T>;
  sort(sortSpec: Record<string, 1 | -1>): MongoCursorLike<T>;
  toArray(): Promise<T[]>;
}

export interface MongoWriteResult {
  acknowledged: boolean;
  matchedCount: number;
  modifiedCount: number;
}

export interface MongoCollectionLike<T extends Document = Document> {
  bulkWrite(operations: AnyBulkWriteOperation<T>[], options?: Document): Promise<unknown>;
  countDocuments(filter?: Filter<T>, options?: { limit?: number }): Promise<number>;
  createIndex(index: Record<string, 1 | -1>, options?: Document): Promise<string>;
  deleteMany(filter?: Filter<T>): Promise<DeleteResult>;
  distinct(key: string, filter?: Filter<T>): Promise<unknown[]>;
  drop(): Promise<boolean>;
  find(filter?: Filter<T>, options?: Document): MongoCursorLike<T>;
  findOne(filter?: Filter<T>): Promise<T | null>;
  insertOne(doc: OptionalUnlessRequiredId<T>, options?: Document): Promise<unknown>;
  updateMany(filter: Filter<T>, update: Document, options?: Document): Promise<MongoWriteResult>;
  updateOne(filter: Filter<T>, update: Document, options?: Document): Promise<MongoWriteResult>;
}

export interface MongoDatabaseLike {
  readonly databaseName: string;
  collection<T extends Document = Document>(name: string): MongoCollectionLike<T>;
  command(command: Document): Promise<Document>;
  createCollection<T extends Document = Document>(name: string, options?: Document): Promise<MongoCollectionLike<T>>;
  listCollections(filter?: Document, options?: Document): {
    toArray(): Promise<Array<{ name: string }>>;
  };
}
