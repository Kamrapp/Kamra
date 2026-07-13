import { Injectable, inject, signal } from "@angular/core";

import { buildApiUrl } from "../api-url";
import { AuthService } from "../auth.service";
import { readApiErrorMessage } from "../shared/api-errors";
import { LocalizationService, type TranslationKey } from "../shared/localization.service";

export interface HouseholdInvitation {
  createdAt: string;
  email: string;
  householdId: string;
  householdName?: string;
  id: string;
  status: "pending" | "accepted" | "revoked";
  updatedAt: string;
}

export type HouseholdInvitationResult =
  | { invitation?: HouseholdInvitation; message?: string; status: "error" }
  | { invitation: HouseholdInvitation; status: "ok" };

@Injectable({ providedIn: "root" })
export class HouseholdInvitationService {
  private readonly auth = inject(AuthService);
  private readonly loc = inject(LocalizationService);

  readonly pendingInvitations = signal<HouseholdInvitation[]>([]);
  readonly loading = signal(false);
  readonly errorMessage = signal("");

  async loadPending(): Promise<void> {
    if (!this.auth.token()) {
      this.clear();
      return;
    }

    this.loading.set(true);
    const response = await fetch(buildApiUrl("/api/invitations"), {
      headers: { accept: "application/json", ...this.auth.getAuthorizationHeaders() },
      method: "GET"
    }).catch(() => null);
    this.loading.set(false);

    if (!response || !response.ok) {
      this.errorMessage.set(
        response
          ? await readApiErrorMessage(response, this.loc.t("app.invitationLoadFailure"), (key) =>
              this.loc.t(key as TranslationKey)
            )
          : this.loc.t("app.invitationLoadFailure")
      );
      return;
    }

    const payload = (await response.json()) as { invitations?: HouseholdInvitation[] };
    this.errorMessage.set("");
    this.pendingInvitations.set(payload.invitations ?? []);
  }

  async listForHousehold(householdId: string): Promise<HouseholdInvitation[]> {
    const response = await fetch(
      buildApiUrl(`/api/households/${encodeURIComponent(householdId)}/invitations`),
      {
        headers: { accept: "application/json", ...this.auth.getAuthorizationHeaders() },
        method: "GET"
      }
    ).catch(() => null);
    if (!response || !response.ok) return [];

    const payload = (await response.json()) as { invitations?: HouseholdInvitation[] };
    return payload.invitations ?? [];
  }

  async invite(householdId: string, email: string): Promise<HouseholdInvitationResult> {
    const response = await fetch(
      buildApiUrl(`/api/households/${encodeURIComponent(householdId)}/invitations`),
      {
        body: JSON.stringify({ email }),
        headers: {
          accept: "application/json",
          "content-type": "application/json",
          ...this.auth.getAuthorizationHeaders()
        },
        method: "POST"
      }
    ).catch(() => null);
    if (!response || !response.ok) {
      return {
        message: response
          ? await readApiErrorMessage(response, this.loc.t("household.invitationFailure"), (key) =>
              this.loc.t(key as TranslationKey)
            )
          : this.loc.t("household.invitationFailure"),
        status: "error"
      };
    }

    const payload = (await response.json()) as { invitation: HouseholdInvitation };
    return { invitation: payload.invitation, status: "ok" };
  }

  async accept(invitationId: string): Promise<HouseholdInvitationResult> {
    const response = await fetch(
      buildApiUrl(`/api/invitations/${encodeURIComponent(invitationId)}/accept`),
      {
        body: "{}",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
          ...this.auth.getAuthorizationHeaders()
        },
        method: "POST"
      }
    ).catch(() => null);
    if (!response || !response.ok) {
      return {
        message: response
          ? await readApiErrorMessage(response, this.loc.t("app.invitationAcceptFailure"), (key) =>
              this.loc.t(key as TranslationKey)
            )
          : this.loc.t("app.invitationAcceptFailure"),
        status: "error"
      };
    }

    const payload = (await response.json()) as { invitation: HouseholdInvitation };
    await this.loadPending();
    return { invitation: payload.invitation, status: "ok" };
  }

  clear(): void {
    this.pendingInvitations.set([]);
    this.errorMessage.set("");
    this.loading.set(false);
  }
}
