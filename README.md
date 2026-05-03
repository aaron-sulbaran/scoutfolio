# ScoutFolio

An AI portfolio-builder for students. Connect your GitHub, resume, and personal sites; an agent reads everything, judges what's portfolio-worthy, writes recruiter-facing copy, and ships you a personal site you'd actually share.

Built for Vercel's "Zero to Agent" hackathon (v0 + MCPs track). Live at **https://scoutfolio.vercel.app**.

## What's working today

- Editorial landing page (`/`) with three example portfolios and an explainer at `/how-it-works`
- Google OAuth sign-in via NextAuth v5
- Protected `/connect` page with four connector cards
- **Resume → Vercel Blob → Claude Haiku 4.5 with native PDF vision** → structured findings
- **Personal URL → server-side fetch + parse → agent extraction**
- **Run discovery** — `generateObject` synthesizes a ranked portfolio inventory across all connected sources
- Streaming agent narration via NDJSON

GitHub MCP, portfolio template generation, live preview, and export-as-zip are May 4 deliverables.

## Stack

- **Next.js 16.2** (App Router, Turbopack) + **React 19** + **TypeScript strict**
- **Tailwind CSS 4** (CSS-first `@theme` config — no `tailwind.config.ts`)
- **NextAuth v5 beta** with Google provider, JWT sessions
- **AI SDK 6** + **@ai-sdk/anthropic 3** (direct provider, `claude-haiku-4-5`)
- **Vercel Blob** (private access) for resume uploads
- **Vercel Functions** for the streaming agent routes
- Hosted on **Vercel**

## Local setup

Requires Node 20+ and pnpm 10+.

```bash
pnpm install
cp .env.example .env.local
# Fill in every value in .env.local — see the inline comments
pnpm dev
```

Then open http://localhost:3000 and sign in with Google.

### Required environment variables

| Variable | What it is | Where to get it |
|---|---|---|
| `AUTH_SECRET` | NextAuth session encryption key | `openssl rand -base64 32` |
| `AUTH_GOOGLE_ID` | Google OAuth Client ID | Google Cloud Console → APIs & Services → Credentials |
| `AUTH_GOOGLE_SECRET` | Google OAuth Client Secret | Same place |
| `ANTHROPIC_API_KEY` | Claude API key for the agent | https://console.anthropic.com/settings/keys |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob read/write token | Auto-injected after creating a Blob store on Vercel |
| `KV_REST_API_URL` | Upstash Redis REST URL (rate limit) | Auto-injected by the Vercel Marketplace Upstash integration |
| `KV_REST_API_TOKEN` | Upstash Redis REST token | Same |

Authorized redirect URIs to configure in Google Cloud Console:

- `http://localhost:3000/api/auth/callback/google`
- `https://<your-domain>/api/auth/callback/google`

## Project layout

See `AGENTS.md` for the full architecture map. High-level:

```
app/api/extract/    # Streaming agent route (URL or PDF)
app/api/discover/   # Inventory synthesis route
app/api/blob/upload # Server-side Blob upload
app/connect/        # Protected connectors UI
components/         # SiteNav, footers, connector grid, findings views, inventory panel
lib/                # Agent tools (fetchUrl, submitFindings) + NDJSON stream reader
docs/               # PRD v1.0 + 2-hour demo PRD
```

## Deploying

```bash
vercel deploy --prod --yes
```

Env changes in the Vercel dashboard only apply to *new* deployments — always redeploy after editing them.

## Cost protection and abuse hardening

ScoutFolio sits behind a multi-layer guard so a single viral tweet can't drain the Anthropic key. The first layer (per-user Upstash quota) is the load-bearing one; the rest are defense-in-depth.

### Layer 1: per-user daily quotas (Upstash Redis)

`lib/rate-limit.ts` keys on `session.user.email` and enforces a fixed-window budget per route:

| Route | Budget |
|---|---|
| `POST /api/extract` | 5 / 24h |
| `POST /api/discover` | 5 / 24h |
| `POST /api/blob/upload` | 10 / 24h |

When a user hits the cap, the route returns HTTP 429 with `Retry-After`, `X-RateLimit-Remaining`, and `X-RateLimit-Reset`, and the connector UI renders an editorial "Daily limit reached" message. The model is never called.

To provision the store: Vercel dashboard → Storage → Create Database → Upstash → Redis → Connect to project. The integration auto-injects `KV_REST_API_URL`, `KV_REST_API_TOKEN`, and two more `KV_*` vars. Run `vercel env pull .env.local` after connecting so local dev uses the same store.

If `KV_REST_API_URL`/`KV_REST_API_TOKEN` are missing, the limiter fails *open* in development and *closed* in production (returns 429 immediately) so a misconfigured deploy can't silently disable the budget.

### Layer 2: anonymous burst protection (Vercel Firewall)

A Firewall rule on the project caps `/api/*` traffic at **30 requests/minute per IP** (action: deny). Sits in front of the Upstash per-user limiter and stops a script from rapid-firing before the auth/limit checks even run. Vercel's default system WAF (DDoS, bot, attack-pattern protection) runs alongside it.

To inspect or edit: https://vercel.com/aaron-sulbaran-projects/scoutfolio/firewall

### Layer 3: Anthropic spend cap

Anthropic doesn't expose a daily cap on individual/Hobby tier — that requires contacting their sales team and using a workspace-scoped key. The available control is a **monthly spend limit** at https://console.anthropic.com/settings/limits. Solo-dev posture: skip for now and rely on the per-user Upstash limit (5 extracts × N users × ~$0.05/run is the worst-case theoretical drain, well below pain threshold). Set a monthly cap if/when ScoutFolio gets meaningful organic traffic.

### Layer 4: security headers

`next.config.ts` ships a Content-Security-Policy plus the standard hardening trio (`X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, `Permissions-Policy`) on every route. Dev relaxes `script-src` to allow Next.js HMR; prod tightens it.

### Smoke test the limiter

```
# 1. Sign in with Google at http://localhost:3000
# 2. Trigger 6 extractions in quick succession (URL or resume) on the same account
# 3. The 6th must show "Daily limit reached" instead of running the agent
# 4. Sign out and POST to /api/extract — must return 401 (auth gate runs before limiter)
```

## Documentation

- `docs/SCOUTFOLIO_PRD.md` — full v1.0 product spec
- `docs/SCOUTFOLIO_2HR_DEMO_PRD.md` — live-event demo scope
- `AGENTS.template.md` — generic agent onboarding scaffold for forks (copy to `AGENTS.md` and customize)
- `AGENTS.md` — maintainer-local agent instructions when present (gitignored here); read before substantive changes if your clone has one

## License

Private (hackathon submission). License TBD post-hackathon.
