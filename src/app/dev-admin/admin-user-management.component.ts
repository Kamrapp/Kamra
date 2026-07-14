import { Component, inject, signal, type OnInit } from "@angular/core";
import { RouterLink } from "@angular/router";

import { AuthService } from "../auth.service";
import { AdminDashboardService } from "./admin-dashboard.service";
import { LocalizationService } from "../shared/localization.service";
import { ToastService } from "../shared/toast.service";

interface AdminUser {
  createdAt: string | null;
  email: string;
  households: Array<{
    householdId: string;
    householdName: string;
    role: "member" | "owner";
  }>;
  role: "admin" | "user";
  status: "active" | "disabled";
}

@Component({
  selector: "app-admin-user-management",
  standalone: true,
  imports: [RouterLink],
  templateUrl: "./admin-user-management.component.html",
  styleUrl: "./admin-user-management.component.css"
})
export class AdminUserManagementComponent implements OnInit {
  readonly admin = inject(AdminDashboardService);
  readonly auth = inject(AuthService);
  readonly loc = inject(LocalizationService);
  readonly toast = inject(ToastService);
  readonly users = signal<AdminUser[]>([]);
  readonly passwords = signal<Record<string, string>>({});
  readonly loadState = signal<"idle" | "loading" | "error">("idle");
  readonly message = signal("");
  readonly busyEmail = signal<string | null>(null);

  ngOnInit(): void {
    void this.loadUsers();
  }

  async loadUsers(): Promise<void> {
    this.loadState.set("loading");
    this.message.set("");
    await this.auth.loadCurrentUser();
    if (this.auth.user()?.role !== "admin") {
      this.loadState.set("error");
      this.message.set(this.loc.t("health.adminOnlyDescription"));
      return;
    }

    try {
      const response = await this.admin.request("/api/admin/users", { method: "GET" });
      const { message, payload } = await this.admin.readPayload<{ users: AdminUser[] }>(
        response,
        this.loc.t("health.adminUsersLoadFailure")
      );
      if (!response.ok || !payload) {
        this.loadState.set("error");
        this.message.set(message);
        return;
      }

      this.users.set(payload.users);
      this.loadState.set("idle");
    } catch {
      this.loadState.set("error");
      this.message.set(this.loc.t("health.adminUsersLoadFailure"));
    }
  }

  setPassword(email: string, password: string): void {
    this.passwords.update((values) => ({ ...values, [email]: password }));
  }

  passwordFor(email: string): string {
    return this.passwords()[email] ?? "";
  }

  async savePassword(user: AdminUser): Promise<void> {
    const password = this.passwordFor(user.email);
    if (password.length < 8) {
      this.toast.push(this.loc.t("health.adminUserPasswordRequired"), "error");
      return;
    }

    this.busyEmail.set(user.email);
    try {
      const response = await this.admin.request(
        `/api/admin/users/${encodeURIComponent(user.email)}/password`,
        {
          body: JSON.stringify({ password }),
          headers: { "content-type": "application/json" },
          method: "PATCH"
        }
      );
      const { message } = await this.admin.readPayload(
        response,
        this.loc.t("health.adminUserPasswordFailure")
      );
      if (!response.ok) {
        this.toast.push(message, "error");
        return;
      }

      this.passwords.update((values) => ({ ...values, [user.email]: "" }));
      this.toast.push(this.loc.t("health.adminUserPasswordSaved"), "success");
    } catch {
      this.toast.push(this.loc.t("health.adminUserPasswordFailure"), "error");
    } finally {
      this.busyEmail.set(null);
    }
  }

  async deleteUser(user: AdminUser): Promise<void> {
    if (!window.confirm(this.loc.t("health.adminUserDeleteConfirm", { email: user.email }))) {
      return;
    }

    this.busyEmail.set(user.email);
    try {
      const response = await this.admin.request(
        `/api/admin/users/${encodeURIComponent(user.email)}`,
        { method: "DELETE" }
      );
      const { message, payload } = await this.admin.readPayload<{
        deletedHouseholdIds: string[];
        promotedUserIds: string[];
      }>(response, this.loc.t("health.adminUserDeleteFailure"));
      if (!response.ok || !payload) {
        this.toast.push(message, "error");
        return;
      }

      this.users.update((users) => users.filter((candidate) => candidate.email !== user.email));
      this.toast.push(
        this.loc.t("health.adminUserDeleted", {
          deletedHouseholds: payload.deletedHouseholdIds.length,
          promotedUsers: payload.promotedUserIds.length
        }),
        "success"
      );
    } catch {
      this.toast.push(this.loc.t("health.adminUserDeleteFailure"), "error");
    } finally {
      this.busyEmail.set(null);
    }
  }

  isCurrentUser(user: AdminUser): boolean {
    return this.auth.user()?.email === user.email;
  }
}
