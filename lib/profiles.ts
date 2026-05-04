import { Redis } from "@upstash/redis";

// Profile storage keyed by primary email (Google account email). Lives on the
// same Upstash instance the rate limiter uses; we just namespace under a
// different key prefix so the two never collide.

const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
const token =
  process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;

const redis = url && token ? new Redis({ url, token }) : null;

const PREFIX = "scoutfolio:profile:";

export type Profile = {
  onboardingNarrative?: string;
  displayName?: string;
  githubLogin?: string;
};

function key(email: string) {
  return `${PREFIX}${email.toLowerCase()}`;
}

export async function getProfile(email: string): Promise<Profile | null> {
  if (!redis || !email) return null;
  try {
    const stored = (await redis.get(key(email))) as Profile | null;
    return stored ?? null;
  } catch (err) {
    console.warn("[profiles] get failed:", err);
    return null;
  }
}

export async function patchProfile(
  email: string,
  patch: Profile
): Promise<void> {
  if (!redis || !email) return;
  try {
    const existing = ((await redis.get(key(email))) as Profile | null) ?? {};
    const merged: Profile = { ...existing };
    if ("onboardingNarrative" in patch) {
      const v = patch.onboardingNarrative;
      if (typeof v === "string" && v.length > 0) {
        merged.onboardingNarrative = v.slice(0, 500);
      } else {
        delete merged.onboardingNarrative;
      }
    }
    if ("displayName" in patch) {
      const v = patch.displayName;
      if (typeof v === "string" && v.length > 0) {
        merged.displayName = v.slice(0, 60);
      } else {
        delete merged.displayName;
      }
    }
    if ("githubLogin" in patch) {
      const v = patch.githubLogin;
      if (typeof v === "string" && v.length > 0) {
        merged.githubLogin = v.slice(0, 80);
      } else {
        delete merged.githubLogin;
      }
    }
    await redis.set(key(email), merged);
  } catch (err) {
    console.warn("[profiles] patch failed:", err);
  }
}
