import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const url =
  process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
const token =
  process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;

const redis = url && token ? new Redis({ url, token }) : null;

const LIMITS = {
  extract: { max: 5, window: "24 h" },
  discover: { max: 5, window: "24 h" },
  upload: { max: 10, window: "24 h" },
} as const;

export type LimiterKey = keyof typeof LIMITS;

const limiters: Record<LimiterKey, Ratelimit | null> = {
  extract: build("extract"),
  discover: build("discover"),
  upload: build("upload"),
};

function build(key: LimiterKey): Ratelimit | null {
  if (!redis) return null;
  const cfg = LIMITS[key];
  return new Ratelimit({
    redis,
    // Fixed window matches a "5 per 24h" budget cleanly: clear daily quota,
    // predictable reset, and one Redis op per check.
    limiter: Ratelimit.fixedWindow(cfg.max, cfg.window),
    prefix: `scoutfolio:rl:${key}`,
    analytics: true,
  });
}

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

export async function enforceLimit(
  key: LimiterKey,
  identifier: string
): Promise<LimitResult> {
  const limiter = limiters[key];

  // No Redis configured. Fail OPEN locally so dev still works without an
  // Upstash store, fail CLOSED in production so a misconfig doesn't silently
  // disable cost protection.
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

  const { success, limit, remaining, reset } = await limiter.limit(identifier);
  const retryAfterSec = Math.max(0, Math.ceil((reset - Date.now()) / 1000));
  const headers = rateLimitHeaders(
    limit,
    remaining,
    reset,
    success ? undefined : retryAfterSec
  );

  if (!success) {
    return { ok: false, limit, resetMs: reset, headers };
  }
  return { ok: true, headers };
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
    key === "extract"
      ? "extractions"
      : key === "discover"
        ? "discovery runs"
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
