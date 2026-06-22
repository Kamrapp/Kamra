import { randomBytes, scrypt, timingSafeEqual, type ScryptOptions } from "node:crypto";

const scryptParameters = {
  keyLength: 64,
  cost: 16384,
  blockSize: 8,
  parallelization: 1
};

function deriveKey(
  password: string,
  salt: Buffer,
  keyLength: number,
  options: ScryptOptions
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, keyLength, options, (error, derivedKey) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(derivedKey);
    });
  });
}

export interface PasswordHash {
  algorithm: "scrypt";
  blockSize: number;
  cost: number;
  hash: string;
  keyLength: number;
  parallelization: number;
  salt: string;
}

export async function hashPassword(
  password: string,
  salt: Buffer = randomBytes(16)
): Promise<PasswordHash> {
  const derivedKey = await deriveKey(password, salt, scryptParameters.keyLength, {
    N: scryptParameters.cost,
    p: scryptParameters.parallelization,
    r: scryptParameters.blockSize
  });

  return {
    algorithm: "scrypt",
    blockSize: scryptParameters.blockSize,
    cost: scryptParameters.cost,
    hash: derivedKey.toString("base64"),
    keyLength: scryptParameters.keyLength,
    parallelization: scryptParameters.parallelization,
    salt: salt.toString("base64")
  };
}

export async function verifyPassword(
  password: string,
  passwordHash: PasswordHash
): Promise<boolean> {
  const salt = Buffer.from(passwordHash.salt, "base64");
  const expectedHash = Buffer.from(passwordHash.hash, "base64");
  const actualHash = await deriveKey(password, salt, passwordHash.keyLength, {
    N: passwordHash.cost,
    p: passwordHash.parallelization,
    r: passwordHash.blockSize
  });

  return actualHash.length === expectedHash.length && timingSafeEqual(actualHash, expectedHash);
}
