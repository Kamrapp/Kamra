import { verifyPassword, type PasswordHash } from "./password-hash.js";

export interface UserDocument {
  authProvider: "bootstrap_credentials";
  createdAt?: Date;
  email: string;
  passwordHash: PasswordHash;
  role: "admin";
  status: "active" | "disabled";
  updatedAt?: Date;
}

export interface AuthenticatedUser {
  email: string;
  role: "admin";
}

export interface UserRepository {
  findActiveUserByEmail(email: string): Promise<UserDocument | null>;
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
  if (!user || user.role !== "admin") {
    return { status: "invalid_credentials" };
  }

  const passwordMatches = await verifyPassword(password, user.passwordHash);
  if (!passwordMatches) {
    return { status: "invalid_credentials" };
  }

  return {
    status: "authenticated",
    user: {
      email: user.email,
      role: user.role
    }
  };
}
