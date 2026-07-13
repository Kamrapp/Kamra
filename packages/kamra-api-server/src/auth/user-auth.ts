import { verifyPassword, type PasswordHash } from "./password-hash.js";

export type UserRole = "admin" | "user";
export type UserLanguagePreference = "en" | "hu";
export type UserThemePreference = "dark" | "light";

export interface UserProfile {
  language?: UserLanguagePreference;
  theme?: UserThemePreference;
}

export interface AlphaAccessAudit {
  createdAt: Date;
  createdByUserId: string;
}

export interface UserDocument {
  authProvider: "bootstrap_credentials";
  alphaAccess?: AlphaAccessAudit;
  createdAt?: Date;
  email: string;
  passwordHash: PasswordHash;
  profile?: UserProfile;
  role: UserRole;
  status: "active" | "disabled";
  updatedAt?: Date;
}

export interface AuthenticatedUser {
  email: string;
  profile: UserProfile;
  role: UserRole;
}

export interface AdminUserHouseholdMembership {
  householdId: string;
  householdName: string;
  role: "member" | "owner";
}

export interface AdminUserListItem {
  createdAt: string | null;
  email: string;
  households: AdminUserHouseholdMembership[];
  role: UserRole;
  status: UserDocument["status"];
}

export interface AdminUserDeletionResult {
  deletedHouseholdIds: string[];
  promotedUserIds: string[];
  removedMembershipCount: number;
}

export interface UserRepository {
  createAlphaUser(input: {
    alphaAccess: AlphaAccessAudit;
    email: string;
    passwordHash: PasswordHash;
    role: UserRole;
    status: UserDocument["status"];
  }): Promise<UserDocument>;
  createRegisteredUser?(input: {
    email: string;
    passwordHash: PasswordHash;
    role: UserRole;
    status: UserDocument["status"];
  }): Promise<UserDocument>;
  deleteUser?(email: string): Promise<AdminUserDeletionResult | null>;
  findActiveUserByEmail(email: string): Promise<UserDocument | null>;
  findUserByEmail(email: string): Promise<UserDocument | null>;
  listAdminUsers?(): Promise<AdminUserListItem[]>;
  updateUserPassword?(email: string, passwordHash: PasswordHash): Promise<boolean>;
  updateUserProfile(email: string, profile: UserProfile): Promise<UserDocument | null>;
}

export type AuthenticateUserResult =
  | {
      status: "authenticated";
      user: AuthenticatedUser;
    }
  | {
      status: "invalid_credentials";
    };

export function normalizeUserEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isUserThemePreference(value: unknown): value is UserThemePreference {
  return value === "dark" || value === "light";
}

export function isUserLanguagePreference(value: unknown): value is UserLanguagePreference {
  return value === "en" || value === "hu";
}

export function toAuthenticatedUser(user: UserDocument): AuthenticatedUser {
  return {
    email: user.email,
    profile: {
      language: isUserLanguagePreference(user.profile?.language)
        ? user.profile.language
        : undefined,
      theme: isUserThemePreference(user.profile?.theme) ? user.profile.theme : undefined
    },
    role: user.role
  };
}

export async function authenticateUser(
  email: string,
  password: string,
  repository: UserRepository,
  options: { alphaAccessEnabled?: boolean } = {}
): Promise<AuthenticateUserResult> {
  const normalizedEmail = normalizeUserEmail(email);
  if (!normalizedEmail || !password) {
    return { status: "invalid_credentials" };
  }

  const user = await repository.findActiveUserByEmail(normalizedEmail);
  if (!user) {
    return { status: "invalid_credentials" };
  }

  if (user.alphaAccess && options.alphaAccessEnabled === false) {
    return { status: "invalid_credentials" };
  }

  const passwordMatches = await verifyPassword(password, user.passwordHash);
  if (!passwordMatches) {
    return { status: "invalid_credentials" };
  }

  return {
    status: "authenticated",
    user: toAuthenticatedUser(user)
  };
}
