import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

const cspDirectives: Record<string, string[]> = {
  "default-src": ["'self'"],
  "script-src": isProd
    ? ["'self'", "'unsafe-inline'"]
    : ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
  "style-src": ["'self'", "'unsafe-inline'"],
  "img-src": ["'self'", "data:", "blob:"],
  "media-src": ["'self'", "https:"],
  "font-src": ["'self'", "data:"],
  "connect-src": isProd
    ? ["'self'"]
    : ["'self'", "ws:", "wss:"],
  "frame-ancestors": ["'none'"],
  "form-action": ["'self'"],
  "base-uri": ["'self'"],
  "object-src": ["'none'"],
};

const csp = Object.entries(cspDirectives)
  .map(([k, v]) => `${k} ${v.join(" ")}`)
  .join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
