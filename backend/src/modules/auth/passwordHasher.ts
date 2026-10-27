/**
 * 5TOT ĐHĐN — Password Hashing Service (Backend V2)
 * Uses Argon2id for secure password hashing with constant-time verification.
 */

import argon2 from 'argon2';

export interface IPasswordHasher {
  hash(password: string): Promise<string>;
  verify(hash: string, plainText: string): Promise<boolean>;
}

export class Argon2PasswordHasher implements IPasswordHasher {
  public async hash(password: string): Promise<string> {
    return argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 19456, // 19 MiB per OWASP recommendation
      timeCost: 2,
      parallelism: 1,
    });
  }

  public async verify(hash: string, plainText: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, plainText);
    } catch {
      return false;
    }
  }
}

export const defaultPasswordHasher = new Argon2PasswordHasher();
