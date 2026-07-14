import { normalizeUserEmail } from "../../auth/user-auth.js";
import { MongoHouseholdInvitationRepository } from "../../household/current/mongo-household-invitation-repository.js";
import { json, unauthorized, type AppRoute } from "../app-route-context.js";

export const householdInvitationsRoute: AppRoute = {
  match: (request) =>
    (request.method === "GET" || request.method === "POST") &&
    /^\/api\/households\/[^/]+\/invitations$/.test(request.path),
  handle: async (request, context) => {
    const user = context.authenticateRequestUser(request);
    if (!user) return unauthorized();

    const match = request.path.match(/^\/api\/households\/([^/]+)\/invitations$/);
    const householdId = match ? decodePathPart(match[1]) : null;
    if (!householdId) return json(400, { error: "invalid_household_id" });

    const repository = await createInvitationRepository(context);
    if (!repository) return json(503, { error: "household_not_configured" });

    if (request.method === "GET") {
      const invitations = await repository.listPendingForHousehold({
        householdId,
        userId: user.email
      });
      return invitations ? json(200, { invitations }) : json(404, { error: "household_not_found" });
    }

    const email = readInvitationEmail(request.bodyText);
    if (!email) return json(400, { error: "invalid_invitation_payload" });

    const result = await repository.createPendingInvitation({
      email,
      householdId,
      invitedByUserId: user.email,
      now: new Date().toISOString()
    });
    if (result.status === "created") return json(201, { invitation: result.invitation });
    if (result.status === "already_pending") {
      return json(409, { error: "invitation_already_pending" });
    }
    if (result.status === "already_member") {
      return json(409, { error: "user_already_member" });
    }
    if (result.status === "owner_required") {
      return json(403, { error: "household_owner_required" });
    }

    return json(404, { error: "household_not_found" });
  }
};

export const pendingHouseholdInvitationsRoute: AppRoute = {
  match: (request) => request.method === "GET" && request.path === "/api/invitations",
  handle: async (request, context) => {
    const user = context.authenticateRequestUser(request);
    if (!user) return unauthorized();

    const repository = await createInvitationRepository(context);
    if (!repository) return json(503, { error: "household_not_configured" });

    return json(200, {
      invitations: await repository.listPendingForEmail(user.email)
    });
  }
};

export const acceptHouseholdInvitationRoute: AppRoute = {
  match: (request) =>
    request.method === "POST" && /^\/api\/invitations\/[^/]+\/accept$/.test(request.path),
  handle: async (request, context) => {
    const user = context.authenticateRequestUser(request);
    if (!user) return unauthorized();

    const match = request.path.match(/^\/api\/invitations\/([^/]+)\/accept$/);
    const invitationId = match ? decodePathPart(match[1]) : null;
    if (!invitationId) return json(400, { error: "invalid_invitation_id" });

    const repository = await createInvitationRepository(context);
    if (!repository) return json(503, { error: "household_not_configured" });

    const result = await repository.acceptInvitation({
      email: user.email,
      invitationId,
      now: new Date().toISOString()
    });
    return result.status === "accepted"
      ? json(200, { invitation: result.invitation })
      : json(404, { error: "invitation_not_found" });
  }
};

export const householdInvitationMutationRoute: AppRoute = {
  match: (request) =>
    (request.method === "DELETE" &&
      /^\/api\/households\/[^/]+\/invitations\/[^/]+$/.test(request.path)) ||
    (request.method === "POST" && /^\/api\/invitations\/[^/]+\/reject$/.test(request.path)),
  handle: async (request, context) => {
    const user = context.authenticateRequestUser(request);
    if (!user) return unauthorized();
    const isReject = request.path.startsWith("/api/invitations/");
    const match = isReject
      ? request.path.match(/^\/api\/invitations\/([^/]+)\/reject$/)
      : request.path.match(/^\/api\/households\/([^/]+)\/invitations\/([^/]+)$/);
    const invitationId = decodePathPart(isReject ? match?.[1] : match?.[2]);
    if (!invitationId) return json(400, { error: "invalid_invitation_id" });

    const repository = await createInvitationRepository(context);
    if (!repository) return json(503, { error: "household_not_configured" });
    const result = isReject
      ? await repository.rejectInvitation({
          email: user.email,
          invitationId,
          now: new Date().toISOString()
        })
      : await repository.revokeInvitation({
          householdId: decodePathPart(match?.[1]) ?? "",
          invitationId,
          now: new Date().toISOString(),
          userId: user.email
        });
    if (result.status === "updated") return json(200, { status: "updated" });
    if (result.status === "owner_required") return json(403, { error: "household_owner_required" });
    return json(404, { error: "invitation_not_found" });
  }
};

export const householdMembersRoute: AppRoute = {
  match: (request) =>
    (request.method === "GET" && /^\/api\/households\/[^/]+\/members$/.test(request.path)) ||
    (request.method === "DELETE" &&
      /^\/api\/households\/[^/]+\/members\/[^/]+$/.test(request.path)) ||
    (request.method === "POST" &&
      /^\/api\/households\/[^/]+\/members\/[^/]+\/transfer$/.test(request.path)),
  handle: async (request, context) => {
    const user = context.authenticateRequestUser(request);
    if (!user) return unauthorized();
    const match = request.path.match(
      /^\/api\/households\/([^/]+)\/members\/([^/]+)(?:\/transfer)?$/
    );
    const householdId = decodePathPart(request.path.match(/^\/api\/households\/([^/]+)/)?.[1]);
    if (!householdId) return json(400, { error: "invalid_household_id" });

    const repository = await createInvitationRepository(context);
    if (!repository) return json(503, { error: "household_not_configured" });
    if (request.method === "GET") {
      const members = await repository.listMembers({ householdId, userId: user.email });
      return members
        ? json(200, { members })
        : json(403, { error: "household_membership_required" });
    }

    const memberUserId = decodePathPart(match?.[2]);
    if (!memberUserId) return json(400, { error: "invalid_member_id" });
    const now = new Date().toISOString();
    const result = request.path.endsWith("/transfer")
      ? await repository.transferOwnership({
          householdId,
          newOwnerUserId: memberUserId,
          now,
          ownerUserId: user.email
        })
      : await repository.removeMember({
          actorUserId: user.email,
          householdId,
          memberUserId,
          now
        });
    if (result.status === "updated") return json(200, { status: "updated" });
    if (result.status === "owner_required" || result.status === "cannot_remove_owner")
      return json(403, { error: result.status });
    return json(404, { error: "member_not_found" });
  }
};

async function createInvitationRepository(
  context: Parameters<AppRoute["handle"]>[1]
): Promise<MongoHouseholdInvitationRepository | null> {
  const config = context.config;
  if (!config.mongodb.uri || !config.mongodb.databaseName) return null;

  const client = await context.getMongoClient(config.mongodb.uri, config.mongodb.dnsServers);
  return new MongoHouseholdInvitationRepository(client.db(config.mongodb.databaseName));
}

function readInvitationEmail(bodyText: string | undefined): string | null {
  try {
    const payload = JSON.parse(bodyText ?? "{}") as { email?: unknown };
    if (typeof payload.email !== "string") return null;
    const email = normalizeUserEmail(payload.email);
    return email.includes("@") ? email : null;
  } catch {
    return null;
  }
}

function decodePathPart(value: string | undefined): string | null {
  if (!value) return null;
  try {
    const decoded = decodeURIComponent(value);
    return decoded.trim() || null;
  } catch {
    return null;
  }
}
