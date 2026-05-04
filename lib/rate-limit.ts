import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const url =
  process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
const token =
  process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;

const redis = url && token ? new Redis({ url, token }) : null;

// Identifiers (Google emails) that bypass all rate limits. Used for solo-dev
// testing so the owner doesn't lock themselves out while iterating. Configure
// via comma-separated RATE_LIMIT_BYPASS_EMAILS; falls back to a hard-coded
// owner email so the bypass works before the env var lands in Vercel.
const BYPASS_EMAILS = new Set(
  (process.env.RATE_LIMIT_BYPASS_EMAILS ?? "aarondsulbaran@gmail.com")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
);

const LIMITS = {
  extractResume: { max: 6, window: "24 h" },
  extractUrl: { max: 6, window: "24 h" },
  extractGithub: { max: 6, window: "24 h" },
  discover: { max: 6, window: "24 h" },
  upload: { max: 10, window: "24 h" },
  generate: { max: 2, window: "24 h" },
  edit: { max: 15, window: "24 h" },
} as const;

export type LimiterKey = keyof typeof LIMITS;

const limiters: Record<LimiterKey, Ratelimit | null> = {
  extractResume: build("extractResume"),
  extractUrl: build("extractUrl"),
  extractGithub: build("extractGithub"),
  discover: build("discover"),
  upload: build("upload"),
  generate: build("generate"),
  edit: build("edit"),
};

function build(key: LimiterKey): Ratelimit | null {
  if (!redis) return null;
  const cfg = LIMITS[key];
  return new Ratelimit({
    redis,
    // Fixed window matches a "N per 24h" budget cleanly: clear daily quota,
    // predictable reset, and one Redis op per check.
    limiter: Ratelimit.fixedWindow(cfg.max, cfg.window),
    prefix: `scoutfolio:rl:${key}`,
    analytics: true,
  });
}

export type LimitSnapshot = {
  remaining: number;
  max: number;
  resetMs: number;
  bypass?: boolean;
};

export type LimitResult =
  | {
      ok: true;
      headers: Record<string, string>;
    }
  | {
      ok: false;
      headers: Record<string, string>;
      limit: number;
      resetMs: number;
    };

function isBypass(identifier: string): boolean {
  return BYPASS_EMAILS.has(identifier.toLowerCase());
}

/**
 * Read remaining count without consuming a slot. Used by /api/limits and as
 * a pre-check inside routes so we can reject requests when the bucket is
 * empty without recording a usage event for failed work.
 */
export async function peekLimit(
  key: LimiterKey,
  identifier: string
): Promise<LimitSnapshot> {
  const cfg = LIMITS[key];
  if (isBypass(identifier)) {
    return {
      remaining: cfg.max,
      max: cfg.max,
      resetMs: Date.now() + 24 * 60 * 60 * 1000,
      bypass: true,
    };
  }
  const limiter = limiters[key];
  if (!limiter) {
    if (process.env.NODE_ENV === "production") {
      return {
        remaining: 0,
        max: cfg.max,
        resetMs: Date.now() + 60_000,
      };
    }
    return {
      remaining: cfg.max,
      max: cfg.max,
      resetMs: Date.now() + 24 * 60 * 60 * 1000,
    };
  }
  const { remaining, reset, limit } = await limiter.getRemaining(identifier);
  return { remaining, max: limit, resetMs: reset };
}

/**
 * Pre-flight check that does NOT consume a slot. Returns the same shape as
 * the old enforceLimit so route code can short-circuit on `ok: false` and
 * surface the existing rate-limited response. Pair this with `recordUsage`
 * after the route observes a successful outcome.
 */
export async function preflightLimit(
  key: LimiterKey,
  identifier: string
): Promise<LimitResult> {
  if (isBypass(identifier)) {
    return { ok: true, headers: { "X-RateLimit-Bypass": "1" } };
  }

  const limiter = limiters[key];
  if (!limiter) {
    if (process.env.NODE_ENV === "production") {
      const resetMs = Date.now() + 60_000;
      return {
        ok: false,
        limit: 0,
        resetMs,
        headers: rateLimitHeaders(0, 0, resetMs, 60),
      };
    }
    return { ok: true, headers: {} };
  }

  const { remaining, reset, limit } = await limiter.getRemaining(identifier);
  if (remaining <= 0) {
    const retryAfterSec = Math.max(0, Math.ceil((reset - Date.now()) / 1000));
    return {
      ok: false,
      limit,
      resetMs: reset,
      headers: rateLimitHeaders(limit, 0, reset, retryAfterSec),
    };
  }
  return {
    ok: true,
    headers: rateLimitHeaders(limit, remaining, reset),
  };
}

/**
 * Consume one slot for `key` against `identifier`. Call this only after the
 * route has observed a successful outcome (e.g. extract returned non-empty
 * findings, discover returned an inventory, generate returned files). Failing
 * paths skip this and the user's quota is preserved.
 */
export async function recordUsage(
  key: LimiterKey,
  identifier: string
): Promise<void> {
  if (isBypass(identifier)) return;
  const limiter = limiters[key];
  if (!limiter) return;
  await limiter.limit(identifier);
}

function rateLimitHeaders(
  limit: number,
  remaining: number,
  resetMs: number,
  retryAfterSec?: number
): Record<string, string> {
  const headers: Record<string, string> = {
    "X-RateLimit-Limit": String(limit),
    "X-RateLimit-Remaining": String(remaining),
    "X-RateLimit-Reset": String(Math.ceil(resetMs / 1000)),
  };
  if (retryAfterSec !== undefined) {
    headers["Retry-After"] = String(retryAfterSec);
  }
  return headers;
}

export function rateLimitedResponse(
  result: Extract<LimitResult, { ok: false }>,
  message: string
): Response {
  const body = JSON.stringify({
    error: "rate_limited",
    message,
    limit: result.limit,
    resetAt: new Date(result.resetMs).toISOString(),
  });
  return new Response(body, {
    status: 429,
    headers: {
      ...result.headers,
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

export function rateLimitMessage(key: LimiterKey, resetMs: number): string {
  const max = LIMITS[key].max;
  const verb =
    key === "extractResume"
      ? "resume extractions"
      : key === "extractUrl"
        ? "URL extractions"
        : key === "extractGithub"
          ? "GitHub extractions"
          : key === "discover"
            ? "discovery runs"
            : key === "generate"
              ? "portfolio generations"
              : key === "edit"
                ? "portfolio edits"
                : "uploads";
  const resetTime = formatResetTime(resetMs);
  return `You've used your ${max} daily ${verb}. Resets at ${resetTime}.`;
}

function formatResetTime(ms: number): string {
  const d = new Date(ms);
  const formatter = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
  return formatter.format(d);
}
