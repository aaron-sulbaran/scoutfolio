<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# ScoutFolio — Agent Onboarding

You are working in the ScoutFolio repository, an AI portfolio-builder for students built for Vercel's "Zero to Agent" hackathon (v0 + MCPs track). Read this file BEFORE doing anything else. Then read the global project context section in `~/.claude/skills/gstack/AGENTS.md` for cross-session conventions.

## What ScoutFolio is

A Next.js app that takes a student from "I have no portfolio" to "I have a deployable, recruiter-ready personal site" without forcing them to figure out *what* to include or *how* to talk about it. Students connect their GitHub, resume PDF, and personal URLs. An agent reads everything, judges what's portfolio-worthy, writes recruiter-facing copy, and synthesizes a ranked inventory. (Inventory editing UI + portfolio template generation + export are May 4 work.)

The product narrative for hackathon judges leans on **the agent visibly working** — streaming narration, tool calls, native PDF vision — and the **multiple Vercel platform pieces** in the stack.

## Live URLs

- Production: https://scoutfolio.vercel.app
- Vercel project: `aaron-sulbaran-projects/scoutfolio`
- Owner: Aaron Sulbaran (aaronsulbaran@utexas.edu)
- Hackathon deadline: May 4, 2026

## Source-of-truth docs

- `docs/SCOUTFOLIO_PRD.md` — full v1.0 product spec for the May 4 cut. Defines personas, features, data model, success metrics, and scope guardrails (§11.4 "What Not to Build").
- `docs/SCOUTFOLIO_2HR_DEMO_PRD.md` — narrow scope of the live-event demo build that has already shipped.
- `~/.claude/plans/i-m-building-out-a-flickering-chipmunk.md` — the executed plan file from the initial build, with phase-by-phase outcomes.

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16.2 (App Router, Turbopack) |
| Language | TypeScript (strict) |
| UI | Tailwind CSS 4 (CSS-first config via `@theme` block in `app/globals.css`) |
| React | 19.2 |
| Auth | NextAuth v5 beta (`5.0.0-beta.31`), Google provider only, JWT sessions, no DB |
| AI | `ai@6` SDK + `@ai-sdk/anthropic@3` direct provider, model `claude-haiku-4-5` |
| Storage | Vercel Blob (private access) for resume PDFs |
| Hosting | Vercel (auto-deploy not yet wired — direct `vercel deploy --prod` from CLI) |
| Package manager | **pnpm** only |

> Vercel AI Gateway was the original choice but we switched to direct Anthropic mid-build to bypass Gateway free-credit issues. Switching back is a one-line change.

## Architecture

```
app/
├── layout.tsx                  # Instrument Sans + Instrument Serif + JetBrains Mono
├── globals.css                 # @theme tokens (palette, fonts, eyebrow utility, reveal animation)
├── page.tsx                    # Landing — Hero, HowItWorks summary, Examples, Closing CTA
├── how-it-works/page.tsx       # v0-generated three-step explainer
├── demo/maya/page.tsx          # v0 placeholder (not yet pasted)
├── connect/page.tsx            # Server-gated /connect — auth check then renders ConnectorGrid
├── actions.ts                  # signInWithGoogle / signOutAction (Server Actions)
├── api/
│   ├── auth/[...nextauth]/     # NextAuth route handler
│   ├── blob/upload/route.ts    # Server-side put() to Vercel Blob (private)
│   ├── extract/route.ts        # Streaming agent: URL fetch OR PDF vision → submitFindings
│   └── discover/route.ts       # generateObject: synthesize ranked inventory from findings
├── auth.ts                     # NextAuth config

components/
├── site-nav.tsx                # Sticky nav with marketing/app variants + Server Action signin
├── site-footer.tsx             # Single-line footer with hackathon attribution
├── scout-mark.tsx              # Tiny aubergine SVG glyph
├── grain.tsx                   # Subtle SVG noise overlay (~4% opacity)
├── portfolio-examples/         # Maya / Jordan / Riya distinct example portfolio cards
└── connect/
    ├── connector-grid.tsx      # GitHub (mock), Resume (Blob+vision), URL (fetch+model), LinkedIn (placeholder), Run discovery
    ├── findings-view.tsx       # Per-card extraction summary (tagline, projects, skills, links) + NarrationPanel
    └── inventory-panel.tsx     # Discovery output: headline + ranked items with scores + suggested next

lib/
├── extract-tools.ts            # AI SDK tools: fetchUrl, submitFindings (parsePdf removed — Claude reads PDFs natively)
└── extract-client.ts           # NDJSON stream reader + Findings type

docs/                           # The two PRDs
.env.example                    # Onboarding template; copy to .env.local
.env.local                      # Gitignored, contains all secrets
```

## Locked conventions (never change without asking)

### Design tokens (CSS-first via Tailwind 4)

All in `app/globals.css` `@theme` block. **No `tailwind.config.ts`.** Color utilities are auto-derived from `--color-*` variables.

```
--color-background: #FAF8F5   warm off-white
--color-foreground: #1A1A1A   near-black
--color-muted:      #6B5E70   muted plum-gray
--color-accent:     #3D2D4F   deep aubergine
--color-card:       #FDFBF8   slightly warmer card surface
--color-border:     #EAE6E0   hairline border
```

**No hardcoded hex anywhere in JSX.** Always use `bg-accent`, `text-muted`, `border-border`, etc. Want to reskin? Change the variable. The whole site updates.

### Typography

- **Display**: Instrument Serif (italic emphasis on key words)
- **Body**: Instrument Sans
- **Mono / eyebrows**: JetBrains Mono

Loaded in `app/layout.tsx` via `next/font/google`. Never reach for Inter, Roboto, or system stacks. The editorial tone depends on this typography.

### Aesthetic guardrails (no AI slop)

- No purple-on-white gradients
- No glassmorphism unless intentional and motivated
- No decorative gradients used as decoration
- No stock illustrations or stock photo grids
- No generic SaaS dashboard layouts (sidebar+main+chat)
- No emoji unless the user explicitly asks
- Subtle hover lifts only (no scroll-jacking, no parallax)
- Italic emphasis is the primary "visual flourish" — used sparingly on the right words

### Code conventions

- No em dashes anywhere (commas, semicolons, slashes, or middle dots are fine). Same in JSX text content (no `&mdash;`).
- TypeScript strict, no `any`.
- Server Components by default. `"use client"` only for interactivity.
- All AI calls server-side.
- Stream all user-facing AI output (NDJSON for our streaming routes).
- Use Zod for AI SDK schemas. **Anthropic structured-output does NOT support `minItems > 1`, `maxItems`, `minimum`, or `maximum`.** Express constraints in `.describe()` text instead.

### Scope guardrails (PRD §11.4)

Do NOT build any of these without explicit user confirmation:

- Payment / subscription flows
- Admin dashboards
- Email notifications
- i18n
- Custom MCP servers (P2)
- Real LinkedIn integration (P2)
- Any general-purpose CMS-style UI

## Current build state (2026-04-27)

Shipped and working:

- ✅ Editorial landing page with hero, how-it-works summary, three example portfolio cards, closing CTA, footer
- ✅ Standalone `/how-it-works` page (v0-generated, in repo)
- ✅ Google OAuth sign-in via NextAuth
- ✅ Protected `/connect` page with four connector cards
- ✅ **Resume upload flow**: client posts FormData → server `put()` to Blob (private) → `/api/extract` reads via `@vercel/blob` `get()` SDK → Claude Haiku 4.5 receives the PDF as a native file part with vision
- ✅ **URL extraction flow**: `fetchUrl` tool fetches HTML, parses with `node-html-parser`, returns clean text + metadata
- ✅ **Run discovery**: `generateObject` synthesizes ranked inventory (headline, items with scores + actions, suggested next projects)
- ✅ Live agent narration via NDJSON streaming events
- ✅ Inventory display panel with editable Feature/Include/Skip toggles
- ✅ `app/demo/maya/page.tsx` placeholder route (NOT yet pasted with v0 content)

Known issues / not yet done:

- ⚠️ **No rate limiting yet.** The next agent invocation should add Upstash KV-backed limits per user — see the rate-limiting prompt the user has saved.
- ⚠️ Anthropic free-tier rate cap (10k tpm on Sonnet 4.6) drove the switch to Haiku 4.5. Quality is still good but acknowledge the tradeoff in any model-selection decisions.
- ⚠️ No GitHub MCP integration yet (visual-only mock card on `/connect`). May 4 work.
- ⚠️ No portfolio template generation, live preview, or export-as-zip. May 4 work.
- ⚠️ No demo mode (PRD §7.11) wired up beyond the placeholder route.

## Environment

Local `.env.local` (gitignored) currently has:

```
AUTH_SECRET=...              ✓ set
AUTH_GOOGLE_ID=...           ✓ set, redirect URIs configured for localhost + scoutfolio.vercel.app
AUTH_GOOGLE_SECRET=...       ✓ set
ANTHROPIC_API_KEY=...        ✓ set, Tier 1 (10k tpm Sonnet, ~50k tpm Haiku)
AI_GATEWAY_API_KEY=...       set but unused (kept for future Gateway switchback)
BLOB_READ_WRITE_TOKEN=...    ✓ set, store is PRIVATE access
```

Vercel envs (per `vercel env ls` audit on 2026-04-27):

- All five present in Production + Preview except AUTH_SECRET also in Development
- `BLOB_READ_WRITE_TOKEN` present in all three
- After any new env var, redeploy with `vercel deploy --prod --yes` because env changes only apply to new deployments

## Common tasks

| Task | Command |
|---|---|
| Local dev | `pnpm dev` |
| Build (incl. typecheck) | `pnpm build` |
| Deploy to prod | `vercel deploy --prod --yes` |
| Inspect last deploy | `vercel ls scoutfolio --prod` |
| List Vercel envs | `vercel env ls` |
| Pull Vercel envs to local | `vercel env pull .env.local` (sandbox may block — user runs manually) |
| Tail prod logs | `vercel logs https://scoutfolio.vercel.app` |

## MCP tooling rules

Per Aaron's global `~/.claude/CLAUDE.md`:

- **Context7** — fetch docs for any library *before* writing code that touches it. The AI SDK API surface evolves fast; do not trust training data.
- **next-devtools-mcp** — use `get_errors`, `get_page_metadata`, `get_logs` instead of grepping terminal output. Requires dev server running.
- **chrome-devtools-mcp** — for visual QA screenshots and viewport testing.
- **Supabase MCP** — when ScoutFolio gains a database, ASK Aaron which Supabase project to target before any MCP call.
- Use the `/browse` skill from gstack for general web browsing rather than `mcp__claude-in-chrome__*` tools.

## Subagent / parallel work

When delegating to subagents, prefer launching multiple in parallel for independent research. The Explore agent is correct for "find files matching X"; the Plan agent for "design how to wire Y."

## Communication preferences

- Lead with the high-level approach, then specifics
- Don't ask follow-up questions unless the answer would meaningfully change the approach
- Be visual and analogy-driven when explaining new concepts
- Commit at logical breakpoints, not at the end of long sessions
- Default to writing no code comments; only add when WHY is non-obvious

## Last words

The two highest-leverage things future you can do here:

1. **Read both PRDs before changing anything substantive.** The May 4 spec sets boundaries that aren't otherwise visible from the code.
2. **Add rate limiting before the next public demo.** Without it, the Anthropic key is one viral tweet away from being drained.
