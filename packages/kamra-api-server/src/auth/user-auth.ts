import { verifyPassword, type PasswordHash } from "./password-hash.js";

export type UserRole = "admin" | "user";
export type UserThemePreference = "dark" | "light";

export interface UserProfile {
  theme?: UserThemePreference;
}

export interface UserDocument {
  authProvider: "bootstrap_credentials";
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

export interface UserRepository {
  findActiveUserByEmail(email: string): Promise<UserDocument | null>;
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

export function toAuthenticatedUser(user: UserDocument): AuthenticatedUser {
  return {
    email: user.email,
    profile: {
      theme: isUserThemePreference(user.profile?.theme)
        ? user.profile.theme
        : undefined
    },
    role: user.role
  };
}

export async function authenticateUser(
  email: string,
  password: string,
  repository: UserRepository
): Promise<AuthenticateUserResult> {
  const normalizedEmail = normalizeUserEmail(email);
  if (!normalizedEmail || !password) {
    return { status: "invalid_credentials" };
  }

  const user = await repository.findActiveUserByEmail(normalizedEmail);
  if (!user) {
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
