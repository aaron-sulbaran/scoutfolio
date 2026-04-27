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

## Documentation

- `docs/SCOUTFOLIO_PRD.md` — full v1.0 product spec
- `docs/SCOUTFOLIO_2HR_DEMO_PRD.md` — live-event demo scope
- `AGENTS.md` — onboarding for AI coding agents (and humans). **Read this before changing anything substantive.**

## License

Private (hackathon submission). License TBD post-hackathon.
