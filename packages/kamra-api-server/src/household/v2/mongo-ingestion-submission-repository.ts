import type { MongoCollectionLike, MongoDatabaseLike } from "../../db/mongo-like.js";
import type { ApiPageRequest } from "../../http/pagination.js";
import type { IngestionSubmission, IngestionSubmissionStatus } from "./stage9-contracts.js";

export class MongoIngestionSubmissionRepository {
  private readonly submissions: MongoCollectionLike<IngestionSubmission>;

  constructor(database: MongoDatabaseLike) {
    this.submissions = database.collection("ingestion_submissions");
  }

  async setupCollections(): Promise<void> {
    await Promise.all([
      this.submissions.createIndex(
        { id: 1 },
        { name: "ingestion_submissions_id_unique", unique: true }
      ),
      this.submissions.createIndex(
        { status: 1, createdAt: -1 },
        { name: "ingestion_submissions_status_date" }
      ),
      this.submissions.createIndex(
        { householdId: 1, shoppingTripId: 1 },
        { name: "ingestion_submissions_household_trip" }
      )
    ]);
  }

  async create(submission: IngestionSubmission): Promise<IngestionSubmission> {
    const existing = await this.submissions.findOne({ id: submission.id });
    if (existing) return existing;
    await this.submissions.insertOne(submission);
    return submission;
  }

  async list(status?: IngestionSubmissionStatus): Promise<IngestionSubmission[]> {
    return await this.submissions
      .find(status ? { status } : {})
      .sort({ createdAt: -1 })
      .toArray();
  }

  async listPage(
    status: IngestionSubmissionStatus | undefined,
    page: ApiPageRequest
  ): Promise<{ hasNextPage: boolean; items: IngestionSubmission[] }> {
    const submissions = await this.submissions
      .find(status ? { status } : {})
      .sort({ createdAt: -1, id: 1 })
      .skip(page.offset)
      .limit(page.pageSize + 1)
      .toArray();
    return {
      hasNextPage: submissions.length > page.pageSize,
      items: submissions.slice(0, page.pageSize)
    };
  }

  async review(input: {
    expectedRevision: number;
    id: string;
    note?: string | null;
    reviewerId: string;
    status: Exclude<IngestionSubmissionStatus, "pending">;
    reviewedAt: string;
  }): Promise<IngestionSubmission> {
    const current = await this.submissions.findOne({ id: input.id });
    if (!current) throw new Error("ingestion_submission_not_found");
    if (current.revision !== input.expectedRevision)
      throw new Error("ingestion_submission_revision_conflict");
    if (current.status !== "pending") throw new Error("ingestion_submission_already_reviewed");
    const updated = {
      ...current,
      reviewNote: input.note ?? null,
      revision: current.revision + 1,
      reviewedAt: input.reviewedAt,
      reviewedByUserId: input.reviewerId,
      status: input.status,
      updatedAt: input.reviewedAt
    };
    const result = await this.submissions.updateOne(
      { id: input.id, revision: input.expectedRevision, status: "pending" },
      { $set: updated }
    );
    if (result.matchedCount !== 1) throw new Error("ingestion_submission_revision_conflict");
    return updated;
  }
}
