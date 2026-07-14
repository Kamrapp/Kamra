import type { MongoCollectionLike, MongoDatabaseLike } from "../db/mongo-like.js";

export interface DatabaseMaintenanceRunDocument {
  completionMarkedAt?: Date;
  completionMarkedByUserId?: string;
  id: string;
  migrationCompletedAt?: Date;
  migrationCompletedByUserId?: string;
  updatedAt: Date;
  validatorUpdatedAt?: Date;
  validatorUpdatedByUserId?: string;
}

export interface DatabaseMaintenanceRunState {
  completionMarkedAt?: string;
  completionMarkedByUserId?: string;
  id: string;
  migrationCompletedAt?: string;
  migrationCompletedByUserId?: string;
  validatorUpdatedAt?: string;
  validatorUpdatedByUserId?: string;
}

export class MongoMaintenanceRunRepository {
  private readonly collection: MongoCollectionLike<DatabaseMaintenanceRunDocument>;

  constructor(database: MongoDatabaseLike) {
    this.collection = database.collection<DatabaseMaintenanceRunDocument>(
      "database_maintenance_runs"
    );
  }

  async listStates(): Promise<DatabaseMaintenanceRunState[]> {
    const documents = await this.collection.find({}).sort({ id: 1 }).toArray();
    return documents.map(toState);
  }

  async markMigrationCompleted(
    id: string,
    userId: string,
    completedAt: Date
  ): Promise<DatabaseMaintenanceRunState> {
    return await this.markActionCompleted({
      id,
      completedAt,
      userId,
      userField: "migrationCompletedByUserId",
      timestampField: "migrationCompletedAt"
    });
  }

  async markEntryComplete(
    id: string,
    userId: string,
    completedAt: Date
  ): Promise<DatabaseMaintenanceRunState> {
    await this.collection.updateOne(
      { id },
      {
        $set: {
          completionMarkedAt: completedAt,
          completionMarkedByUserId: userId,
          migrationCompletedAt: completedAt,
          migrationCompletedByUserId: userId,
          updatedAt: completedAt,
          validatorUpdatedAt: completedAt,
          validatorUpdatedByUserId: userId
        },
        $setOnInsert: { id }
      },
      { upsert: true }
    );

    return toState((await this.collection.findOne({ id })) as DatabaseMaintenanceRunDocument);
  }

  async markValidatorUpdated(
    id: string,
    userId: string,
    updatedAt: Date
  ): Promise<DatabaseMaintenanceRunState> {
    return await this.markActionCompleted({
      id,
      completedAt: updatedAt,
      userId,
      userField: "validatorUpdatedByUserId",
      timestampField: "validatorUpdatedAt"
    });
  }

  private async markActionCompleted(input: {
    completedAt: Date;
    id: string;
    timestampField: "migrationCompletedAt" | "validatorUpdatedAt";
    userField: "migrationCompletedByUserId" | "validatorUpdatedByUserId";
    userId: string;
  }): Promise<DatabaseMaintenanceRunState> {
    await this.collection.updateOne(
      { id: input.id },
      {
        $set: {
          [input.timestampField]: input.completedAt,
          [input.userField]: input.userId,
          updatedAt: input.completedAt
        },
        $setOnInsert: {
          id: input.id
        }
      },
      { upsert: true }
    );

    return toState(
      (await this.collection.findOne({ id: input.id })) as DatabaseMaintenanceRunDocument
    );
  }
}

function toState(document: DatabaseMaintenanceRunDocument): DatabaseMaintenanceRunState {
  return {
    completionMarkedAt: document.completionMarkedAt?.toISOString(),
    completionMarkedByUserId: document.completionMarkedByUserId,
    id: document.id,
    migrationCompletedAt: document.migrationCompletedAt?.toISOString(),
    migrationCompletedByUserId: document.migrationCompletedByUserId,
    validatorUpdatedAt: document.validatorUpdatedAt?.toISOString(),
    validatorUpdatedByUserId: document.validatorUpdatedByUserId
  };
}
