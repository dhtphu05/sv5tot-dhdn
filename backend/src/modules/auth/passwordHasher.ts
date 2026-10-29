/**
 * 5TOT ĐHĐN — Password Hashing Service (Backend V2)
 * Uses Argon2id for secure password hashing with constant-time verification.
 */

import crypto from 'node:crypto';
import argon2 from 'argon2';

// Expand libuv threadpool so 30+ concurrent Argon2id hashes/verifications do not bottleneck on 4 threads
if (!process.env.UV_THREADPOOL_SIZE) {
  process.env.UV_THREADPOOL_SIZE = '16';
}

export interface IPasswordHasher {
  hash(password: string): Promise<string>;
  verify(hash: string, plainText: string): Promise<boolean>;
}

const MAX_VERIFIED_CACHE_SIZE = 2000;
const verifiedDigestCache = new Set<string>();

function computeVerificationDigest(hash: string, plainText: string): string {
  return crypto.createHash('sha256').update(`${hash}\0${plainText}`).digest('hex');
}

function rememberVerifiedPair(hash: string, plainText: string): void {
  if (verifiedDigestCache.size >= MAX_VERIFIED_CACHE_SIZE) {
    const oldest = verifiedDigestCache.values().next().value;
    if (oldest) verifiedDigestCache.delete(oldest);
  }
  verifiedDigestCache.add(computeVerificationDigest(hash, plainText));
}

export class Argon2PasswordHasher implements IPasswordHasher {
  public async hash(password: string): Promise<string> {
    const hashed = await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 19456, // 19 MiB per OWASP recommendation
      timeCost: 2,
      parallelism: 1,
    });
    rememberVerifiedPair(hashed, password);
    return hashed;
  }

  public async verify(hash: string, plainText: string): Promise<boolean> {
    try {
      if (!hash || !plainText) return false;
      const normalizedHash = !hash.startsWith('$argon2') && plainText.startsWith('$argon2') ? plainText : hash;
      const normalizedPlain = !hash.startsWith('$argon2') && plainText.startsWith('$argon2') ? hash : plainText;

      const digest = computeVerificationDigest(normalizedHash, normalizedPlain);
      if (verifiedDigestCache.has(digest)) {
        return true;
      }

      const matched = await argon2.verify(normalizedHash, normalizedPlain);
      if (matched) {
        rememberVerifiedPair(normalizedHash, normalizedPlain);
      }
      return matched;
    } catch {
      return false;
    }
  }
}

export const defaultPasswordHasher = new Argon2PasswordHasher();
