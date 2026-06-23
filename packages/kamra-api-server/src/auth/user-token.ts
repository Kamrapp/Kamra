import { createHmac, timingSafeEqual } from "node:crypto";

import type { UserRole } from "./user-auth.js";

export interface UserTokenPayload {
  email: string;
  exp: number;
  iat: number;
  role: UserRole;
  sub: string;
}

export interface CreateUserTokenInput {
  email: string;
  maxAgeSeconds: number;
  now?: Date;
  role: UserRole;
  secret: string;
}

export type VerifyUserTokenResult =
  | {
      payload: UserTokenPayload;
      status: "valid";
    }
  | {
      status: "expired" | "invalid";
    };

function encodeBase64Url(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function decodeBase64Url(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sign(value: string, secret: string): string {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

function signaturesMatch(actual: string, expected: string): boolean {
  const actualBuffer = Buffer.from(actual);
  const expectedBuffer = Buffer.from(expected);

  return actualBuffer.length === expectedBuffer.length
    && timingSafeEqual(actualBuffer, expectedBuffer);
}

function isUserTokenPayload(value: unknown): value is UserTokenPayload {
  if (!value || typeof value !== "object") {
    return false;
  }

  const payload = value as Partial<UserTokenPayload>;

  return typeof payload.email === "string"
    && typeof payload.exp === "number"
    && typeof payload.iat === "number"
    && (payload.role === "admin" || payload.role === "user")
    && typeof payload.sub === "string";
}

export function createUserToken(input: CreateUserTokenInput): string {
  const issuedAt = Math.floor((input.now ?? new Date()).getTime() / 1000);
  const payload: UserTokenPayload = {
    email: input.email,
    exp: issuedAt + input.maxAgeSeconds,
    iat: issuedAt,
    role: input.role,
    sub: input.email
  };
  const encodedPayload = encodeBase64Url(JSON.stringify(payload));
  const signature = sign(encodedPayload, input.secret);

  return `${encodedPayload}.${signature}`;
}

export function verifyUserToken(
  token: string,
  secret: string,
  now = new Date()
): VerifyUserTokenResult {
  const [encodedPayload, signature, extra] = token.split(".");
  if (!encodedPayload || !signature || extra !== undefined) {
    return { status: "invalid" };
  }

  const expectedSignature = sign(encodedPayload, secret);
  if (!signaturesMatch(signature, expectedSignature)) {
    return { status: "invalid" };
  }

  try {
    const payload = JSON.parse(decodeBase64Url(encodedPayload)) as unknown;
    if (!isUserTokenPayload(payload)) {
      return { status: "invalid" };
    }

    if (payload.exp <= Math.floor(now.getTime() / 1000)) {
      return { status: "expired" };
    }

    return {
      payload,
      status: "valid"
    };
  } catch {
    return { status: "invalid" };
  }
}
