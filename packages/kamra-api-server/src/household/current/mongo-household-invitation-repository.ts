import type { MongoCollectionLike, MongoDatabaseLike } from "../../db/mongo-like.js";
import type {
  HouseholdInvitationListItem,
  HouseholdInvitationRecord,
  HouseholdMembershipRecord,
  HouseholdRecord
} from "../v1/contracts.js";

export type CreateHouseholdInvitationResult =
  | { invitation: HouseholdInvitationRecord; status: "created" | "already_pending" }
  | { status: "already_member" | "household_not_found" | "owner_required" };

export type AcceptHouseholdInvitationResult =
  { invitation: HouseholdInvitationRecord; status: "accepted" } | { status: "not_found" };

export type HouseholdInvitationMutationResult =
  { status: "updated" } | { status: "not_found" | "owner_required" | "cannot_remove_owner" };

export interface HouseholdMemberListItem {
  role: HouseholdMembershipRecord["role"];
  status: HouseholdMembershipRecord["status"];
  updatedAt: string;
  userId: string;
}

export class MongoHouseholdInvitationRepository {
  private readonly householdInvitationsCollection: MongoCollectionLike<HouseholdInvitationRecord>;
  private readonly householdMembershipsCollection: MongoCollectionLike<HouseholdMembershipRecord>;
  private readonly householdsCollection: MongoCollectionLike<HouseholdRecord>;

  constructor(private readonly database: MongoDatabaseLike) {
    this.householdInvitationsCollection =
      database.collection<HouseholdInvitationRecord>("household_invitations");
    this.householdMembershipsCollection =
      database.collection<HouseholdMembershipRecord>("household_memberships");
    this.householdsCollection = database.collection<HouseholdRecord>("households");
  }

  async createPendingInvitation(input: {
    email: string;
    householdId: string;
    invitedByUserId: string;
    now: string;
  }): Promise<CreateHouseholdInvitationResult> {
    const household = await this.householdsCollection.findOne({
      id: input.householdId,
      status: "active"
    });
    if (!household) return { status: "household_not_found" };

    const ownerMembership = await this.householdMembershipsCollection.findOne({
      householdId: input.householdId,
      role: "owner",
      status: "active",
      userId: input.invitedByUserId
    });
    if (!ownerMembership) return { status: "owner_required" };

    const existingMembership = await this.householdMembershipsCollection.findOne({
      householdId: input.householdId,
      status: "active",
      userId: input.email
    });
    if (existingMembership) return { status: "already_member" };

    const existingInvitation = await this.householdInvitationsCollection.findOne({
      email: input.email,
      householdId: input.householdId,
      status: "pending"
    });
    if (existingInvitation) {
      return { invitation: existingInvitation, status: "already_pending" };
    }

    const invitation: HouseholdInvitationRecord = {
      acceptedAt: null,
      acceptedByUserId: null,
      createdAt: input.now,
      email: input.email,
      householdId: input.householdId,
      id: `household_invitation_${stableSlug(input.householdId)}_${stableSlug(input.email)}`,
      invitedByUserId: input.invitedByUserId,
      status: "pending",
      updatedAt: input.now
    };
    await this.householdInvitationsCollection.insertOne(invitation);

    return { invitation, status: "created" };
  }

  async listPendingForHousehold(input: {
    householdId: string;
    userId: string;
  }): Promise<HouseholdInvitationListItem[] | null> {
    const household = await this.householdsCollection.findOne({
      id: input.householdId,
      status: "active"
    });
    if (!household) return null;

    const ownerMembership = await this.householdMembershipsCollection.findOne({
      householdId: input.householdId,
      role: "owner",
      status: "active",
      userId: input.userId
    });
    if (!ownerMembership) return null;

    const invitations = await this.householdInvitationsCollection
      .find({ householdId: input.householdId, status: "pending" })
      .sort({ createdAt: -1 })
      .toArray();
    return invitations.map((invitation) => toListItem(invitation, household.name));
  }

  async listPendingForEmail(email: string): Promise<HouseholdInvitationListItem[]> {
    const invitations = await this.householdInvitationsCollection
      .find({ email, status: "pending" })
      .sort({ createdAt: -1 })
      .toArray();
    const householdIds = invitations.map((invitation) => invitation.householdId);
    const households = await this.householdsCollection
      .find({ id: { $in: householdIds }, status: "active" })
      .toArray();
    const householdNames = new Map(households.map((household) => [household.id, household.name]));

    return invitations.map((invitation) =>
      toListItem(invitation, householdNames.get(invitation.householdId))
    );
  }

  async revokeInvitation(input: {
    householdId: string;
    invitationId: string;
    userId: string;
    now: string;
  }): Promise<HouseholdInvitationMutationResult> {
    const owner = await this.householdMembershipsCollection.findOne({
      householdId: input.householdId,
      role: "owner",
      status: "active",
      userId: input.userId
    });
    if (!owner) return { status: "owner_required" };

    const result = await this.householdInvitationsCollection.updateOne(
      { householdId: input.householdId, id: input.invitationId, status: "pending" },
      { $set: { status: "revoked", updatedAt: input.now } }
    );
    return result.matchedCount ? { status: "updated" } : { status: "not_found" };
  }

  async rejectInvitation(input: {
    email: string;
    invitationId: string;
    now: string;
  }): Promise<HouseholdInvitationMutationResult> {
    const result = await this.householdInvitationsCollection.updateOne(
      { email: input.email, id: input.invitationId, status: "pending" },
      { $set: { status: "revoked", updatedAt: input.now } }
    );
    return result.matchedCount ? { status: "updated" } : { status: "not_found" };
  }

  async listMembers(input: {
    householdId: string;
    userId: string;
  }): Promise<HouseholdMemberListItem[] | null> {
    const membership = await this.householdMembershipsCollection.findOne({
      householdId: input.householdId,
      status: "active",
      userId: input.userId
    });
    if (!membership) return null;

    const members = await this.householdMembershipsCollection
      .find({ householdId: input.householdId, status: "active" })
      .sort({ role: -1, userId: 1 })
      .toArray();
    return members.map(({ role, status, updatedAt, userId }) => ({
      role,
      status,
      updatedAt,
      userId
    }));
  }

  async removeMember(input: {
    householdId: string;
    actorUserId: string;
    memberUserId: string;
    now: string;
  }): Promise<HouseholdInvitationMutationResult> {
    const actor = await this.householdMembershipsCollection.findOne({
      householdId: input.householdId,
      role: "owner",
      status: "active",
      userId: input.actorUserId
    });
    if (!actor) {
      if (input.actorUserId !== input.memberUserId) return { status: "owner_required" };
      const self = await this.householdMembershipsCollection.findOne({
        householdId: input.householdId,
        role: "member",
        status: "active",
        userId: input.memberUserId
      });
      if (!self) return { status: "not_found" };
    }

    const member = await this.householdMembershipsCollection.findOne({
      householdId: input.householdId,
      status: "active",
      userId: input.memberUserId
    });
    if (!member) return { status: "not_found" };
    if (member.role === "owner") return { status: "cannot_remove_owner" };

    const result = await this.householdMembershipsCollection.updateOne(
      { householdId: input.householdId, userId: input.memberUserId, status: "active" },
      { $set: { status: "removed", updatedAt: input.now } }
    );
    return result.matchedCount ? { status: "updated" } : { status: "not_found" };
  }

  async transferOwnership(input: {
    householdId: string;
    ownerUserId: string;
    newOwnerUserId: string;
    now: string;
  }): Promise<HouseholdInvitationMutationResult> {
    const owner = await this.householdMembershipsCollection.findOne({
      householdId: input.householdId,
      role: "owner",
      status: "active",
      userId: input.ownerUserId
    });
    if (!owner) return { status: "owner_required" };

    const newOwner = await this.householdMembershipsCollection.findOne({
      householdId: input.householdId,
      role: "member",
      status: "active",
      userId: input.newOwnerUserId
    });
    if (!newOwner) return { status: "not_found" };

    await this.householdMembershipsCollection.updateOne(
      { id: owner.id, status: "active" },
      { $set: { role: "member", updatedAt: input.now } }
    );
    await this.householdMembershipsCollection.updateOne(
      { id: newOwner.id, status: "active" },
      { $set: { role: "owner", updatedAt: input.now } }
    );
    return { status: "updated" };
  }

  async acceptInvitation(input: {
    email: string;
    invitationId: string;
    now: string;
  }): Promise<AcceptHouseholdInvitationResult> {
    const invitation = await this.householdInvitationsCollection.findOne({
      email: input.email,
      id: input.invitationId,
      status: "pending"
    });
    if (!invitation) return { status: "not_found" };

    const household = await this.householdsCollection.findOne({
      id: invitation.householdId,
      status: "active"
    });
    if (!household) return { status: "not_found" };

    await this.householdMembershipsCollection.updateOne(
      {
        householdId: invitation.householdId,
        userId: input.email
      },
      {
        $set: {
          role: "member",
          status: "active",
          updatedAt: input.now
        },
        $setOnInsert: {
          createdAt: input.now,
          householdId: invitation.householdId,
          id: `membership_${stableSlug(invitation.householdId)}_${stableSlug(input.email)}`,
          userId: input.email
        }
      },
      { upsert: true }
    );

    await this.householdInvitationsCollection.updateOne(
      { id: invitation.id, status: "pending" },
      {
        $set: {
          acceptedAt: input.now,
          acceptedByUserId: input.email,
          status: "accepted",
          updatedAt: input.now
        }
      }
    );

    return {
      invitation: {
        ...invitation,
        acceptedAt: input.now,
        acceptedByUserId: input.email,
        status: "accepted",
        updatedAt: input.now
      },
      status: "accepted"
    };
  }

  async acceptAllForEmail(input: { email: string; now: string }): Promise<number> {
    const invitations = await this.householdInvitationsCollection
      .find({ email: input.email, status: "pending" })
      .toArray();
    let acceptedCount = 0;
    for (const invitation of invitations) {
      const result = await this.acceptInvitation({
        email: input.email,
        invitationId: invitation.id,
        now: input.now
      });
      if (result.status === "accepted") acceptedCount += 1;
    }
    return acceptedCount;
  }
}

function toListItem(
  invitation: HouseholdInvitationRecord,
  householdName: string | undefined
): HouseholdInvitationListItem {
  return {
    createdAt: invitation.createdAt,
    email: invitation.email,
    householdId: invitation.householdId,
    householdName,
    id: invitation.id,
    status: invitation.status,
    updatedAt: invitation.updatedAt
  };
}

function stableSlug(value: string): string {
  const slug = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80);

  return slug || "user";
}
