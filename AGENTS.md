<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# ScoutFolio — Agent Onboarding

You are working in the ScoutFolio repository, an AI portfolio-builder for students built for Vercel's "Zero to Agent" hackathon (v0 + MCPs track). Read this file BEFORE doing anything else. Then read the global project context section in `~/.claude/skills/gstack/AGENTS.md` for cross-session conventions.

## What ScoutFolio is

A Next.js app that takes a student from "I have no portfolio" to "I have a deployable, recruiter-ready personal site" without forcing them to figure out *what* to include or *how* to talk about it. Students connect their GitHub, resume PDF, and personal URLs. An agent reads everything, judges what's portfolio-worthy, writes recruiter-facing copy, and synthesizes a ranked inventory. Reviewed inventory then feeds a portfolio-generation agent that produces a deployable Next.js site rendered in a Claude-artifact-style preview, with a code view and zip export.

The product narrative for hackathon judges leans on **the agent visibly working** (streaming narration, tool calls, native PDF vision, end-to-end portfolio generation) and the **multiple Vercel platform pieces** in the stack.

## Live URLs

- Production: https://scoutfolio.vercel.app
- Vercel project: `aaron-sulbaran-projects/scoutfolio`
- Owner: Aaron Sulbaran (aaronsulbaran@utexas.edu)
- Hackathon deadline: May 4, 2026

## Source-of-truth docs

- `docs/SCOUTFOLIO_PRD.md` — full v1.0 product spec for the May 4 cut. Defines personas, features, data model, success metrics, and scope guardrails (§11.4 "What Not to Build").
- `docs/SCOUTFOLIO_2HR_DEMO_PRD.md` — narrow scope of the live-event demo build that has already shipped.
- `docs/SCOUTFOLIO_NEXT_STEPS.md` — active build appendix. Authoritative for current scope (portfolio agent + preview + zip export + onboarding screen). Read this BEFORE any new feature work. Archive when the increment ships and fold contents into the main PRD.
- `docs/CLAUDE_CODE_PROMPT_GITHUB_MCP.md` — self-contained prompt for shipping the real GitHub MCP integration (OAuth + remote MCP client + extract source). Hand to a fresh Claude Code session.
- `~/.claude/plans/i-m-building-out-a-flickering-chipmunk.md` — the executed plan file from the initial build, with phase-by-phase outcomes.

**Authority order:** AGENTS.md is authoritative for repo-wide conventions and stable architecture. NEXT_STEPS.md is authoritative for current-increment scope only. Where they overlap on conventions, AGENTS.md wins.

## Living document protocol

This file is a living document with a **two-layer structure**. Each layer has different update rules.

**Layer 1 (Stable Conventions, manually curated):** Locked conventions, scope guardrails, communication preferences, MCP rules, rate limit conventions, common tasks. Agents read but do NOT edit. Layer 1 changes only by direct user instruction.

**Layer 2 (Build State, agent-maintained):** Current build state, in flight, known issues, architecture diagram, environment variables, what's next. Agents update via surgical edits at session end.

**Session-end protocol.** When a session ends that shipped meaningful work, the agent must:

1. Re-read this file end to end
2. Check if observed reality matches documented state
3. Propose surgical edits to Layer 2 sections only, matching existing format and emoji conventions exactly (✅ shipped, 🔄 in flight, ⚠️ known issues)
4. Update the date stamp on "Current build state" header to today's date
5. Show the user the diff
6. Apply only after explicit user confirmation

**Drift detection is eager, not lazy.** If at any point during a session the agent observes documented state contradicts code reality, surface this immediately. Do not silently work around stale documentation.

**Length budget.** This file stays under 800 lines. Prefer archiving older items to a sibling `AGENTS_ARCHIVE.md` over appending new ones.

**No-ship sessions.** Research, planning, or audit-only sessions do not update build state.

---

# Layer 1: Stable Conventions (Manually Curated)

Read-only for agents. Edits to this layer require direct user instruction.

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16.2 (App Router, Turbopack) |
| Language | TypeScript (strict) |
| UI | Tailwind CSS 4 (CSS-first config via `@theme` block in `app/globals.css`) |
| React | 19.2 |
| Auth | NextAuth v5 beta (`5.0.0-beta.31`), Google provider only, JWT sessions |
| AI | `ai@6` SDK + `@ai-sdk/anthropic@3` direct provider. Models per route: extract on `claude-haiku-4-5`, discover on `claude-haiku-4-5`, portfolio generation attempts `claude-sonnet-4-6` first with `claude-haiku-4-5` fallback if rate-capped. |
| Storage | Vercel Blob (private) for resume PDFs; Supabase Postgres for user profiles and rate-limit accounting |
| Hosting | Vercel (auto-deploy not yet wired, direct `vercel deploy --prod` from CLI) |
| Package manager | **pnpm** only |
| Rate limiting | Upstash Redis via `@upstash/ratelimit`, sliding window per Google user ID |

> Vercel AI Gateway was the original choice but we switched to direct Anthropic mid-build to bypass Gateway free-credit issues. Switching back is a one-line change.

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

**No hardcoded hex anywhere in JSX.** Always use `bg-accent`, `text-muted`, `border-border`, etc. Want to reskin? Change the variable. The whole site updates. Exception: illustrative portfolio previews in `components/portfolio-examples/portfolios/` may use external palette colors (e.g. dark-mode hex, Tailwind palette classes) to accurately represent the distinct visual styles of generated portfolios per field.

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
- Italic emphasis is the primary "visual flourish", used sparingly on the right words

### Code conventions

- No em dashes anywhere (commas, semicolons, slashes, or middle dots are fine). Same in JSX text content (no `&mdash;`).
- TypeScript strict, no `any`.
- Server Components by default. `"use client"` only for interactivity.
- All AI calls server-side.
- Stream all user-facing AI output (NDJSON for our streaming routes).
- Use Zod for AI SDK schemas. **Anthropic structured-output does NOT support `minItems > 1`, `maxItems`, `minimum`, or `maximum`.** Express constraints in `.describe()` text instead.

### Generated portfolio scaffold

`lib/portfolio-scaffold/files.ts` defines a static Next.js project that ScoutFolio assembles with agent-generated components. The scaffold uses the same color tokens and typography as ScoutFolio itself (Instrument Serif, Instrument Sans, aubergine accent, warm off-white background). When updating ScoutFolio's design tokens, also update the scaffold's `app/globals.css` block to keep generated portfolios visually consistent. The scaffold is committed code, not generated content; agents must NOT modify it during portfolio generation.

The agent's only job during portfolio generation is to fill four components (`hero.tsx`, `projects.tsx`, `about.tsx`, `contact.tsx`) plus the top-level `app/page.tsx`. Everything else (configs, layout, globals, README) comes from the scaffold and is concatenated server-side.

### JWT extensions

User context that needs to persist across requests but doesn't warrant a database lives on the NextAuth JWT via the `jwt` and `session` callbacks in `app/auth.ts`. Current fields beyond NextAuth defaults:

- `onboardingNarrative` (string, set by `/start` or `/settings`, read by `/api/generate-portfolio`)
- `displayName` (string, optional override for the Google profile name. Set by `/settings`. Read everywhere `session.user.name` is rendered or used as a candidate name fallback, via `displayName ?? name`.)

Future fields likely to land here:

- `githubToken` (string, set after GitHub OAuth connection)

For data that does require durability across devices or longer than a JWT lifetime, use Supabase Postgres. JWT is for ephemeral session context; Supabase is for persistent user profile and rate-limit state.

### Scope guardrails (PRD §11.4)

Do NOT build any of these without explicit user confirmation:

- Payment / subscription flows
- Admin dashboards
- Email notifications
- i18n
- Custom MCP servers (P2)
- Real LinkedIn integration (P2)
- Any general-purpose CMS-style UI

### Rate limiting

All AI-calling routes must check rate limits BEFORE doing work. Limits are keyed on the Google user ID from the JWT. Limits are sliding-window via Upstash, not fixed-window, to prevent burst exploitation.

Current limits (all per Google email, fixed 24-hour window):
- `/api/extract` resume source (`extractResume`): 6 per 24h
- `/api/extract` URL source (`extractUrl`): 6 per 24h
- `/api/extract` GitHub source (`extractGithub`): 6 per 24h
- `/api/discover` (`discover`): 6 per 24h
- `/api/blob/upload` (`upload`): 10 per 24h
- `/api/generate-portfolio` (`generate`): 2 per 24h

**Cost-on-success only.** Routes call `preflightLimit(key, id)` to check (no consume) and `recordUsage(key, id)` only after observing success. Failure modes that do NOT consume a slot: empty findings, scanned-PDF dead ends, Anthropic 429s, model errors, validation failures, generated inventory with zero items. Soft failures surface a one-line message to the user with "your usage wasn't affected." When adding a new AI route, follow this pattern.

**Remaining counts in UI.** `GET /api/limits` returns a peek at all surfaced keys for the current user. The `/connect` page reads it on mount and after each successful op, displaying per-card "X of N left today" lines. Bypass accounts render "Unlimited (dev)" instead.

**Bypass list.** `RATE_LIMIT_BYPASS_EMAILS` (comma-separated Google emails) skips all limits for matching identifiers. Used for solo-dev testing. Falls back to the project owner's email if the env var is unset so the bypass works before it's pushed to Vercel.

## MCP tooling rules

Per Aaron's global `~/.claude/CLAUDE.md`:

- **Context7** — fetch docs for any library *before* writing code that touches it. The AI SDK API surface evolves fast; do not trust training data. Especially important for verifying exact model strings (e.g. `claude-sonnet-4-5` vs `claude-sonnet-4-6`) before paste.
- **next-devtools-mcp** — use `get_errors`, `get_page_metadata`, `get_logs` instead of grepping terminal output. Requires dev server running.
- **chrome-devtools-mcp** — for visual QA screenshots and viewport testing.
- **Supabase MCP** — when querying ScoutFolio's database, ASK Aaron which Supabase project to target before any MCP call.
- Use the `/browse` skill from gstack for general web browsing rather than `mcp__claude-in-chrome__*` tools.

## Subagent / parallel work

When delegating to subagents, prefer launching multiple in parallel for independent research. The Explore agent is correct for "find files matching X"; the Plan agent for "design how to wire Y."

## Communication preferences

- Lead with the high-level approach, then specifics
- Don't ask follow-up questions unless the answer would meaningfully change the approach
- Be visual and analogy-driven when explaining new concepts
- Commit at logical breakpoints, not at the end of long sessions
- Default to writing no code comments; only add when WHY is non-obvious

## Common tasks

| Task | Command |
|---|---|
| Local dev | `pnpm dev` |
| Build (incl. typecheck) | `pnpm build` |
| Deploy to prod | `vercel deploy --prod --yes` |
| Inspect last deploy | `vercel ls scoutfolio --prod` |
| List Vercel envs | `vercel env ls` |
| Pull Vercel envs to local | `vercel env pull .env.local` (sandbox may block, user runs manually) |
| Tail prod logs | `vercel logs https://scoutfolio.vercel.app` |

---

# Layer 2: Build State (Agent-Maintained)

Agents update this layer at session end via the protocol above. Match existing format and emoji conventions exactly.

## Architecture

```
app/
├── layout.tsx                  # Instrument Sans + Instrument Serif + JetBrains Mono
├── globals.css                 # @theme tokens (palette, fonts, eyebrow utility, reveal animation, modal keyframes)
├── page.tsx                    # Landing — Hero, HowItWorks summary, Examples, Closing CTA
├── how-it-works/page.tsx       # v0-generated three-step explainer
├── demo/maya/page.tsx          # v0 placeholder (not yet pasted)
├── start/page.tsx              # /start onboarding screen, single textarea, persists to JWT
├── start/start-form.tsx        # Client form + Server Action submit
├── connect/page.tsx            # Server-gated /connect, auth check then renders ConnectorGrid
├── settings/page.tsx           # /settings auth-gated server shell, reads ?saved=/?error= for inline status
├── settings/settings-form.tsx  # Account card (read-only email + display-name override) + Narrative card, identical UX to start-form
├── preview/page.tsx            # /preview auth-gated server shell that renders PreviewClient
├── actions.ts                  # signInWithGoogle / signOutAction / saveNarrative / updateNarrative / updateDisplayName (Server Actions)
├── api/
│   ├── auth/[...nextauth]/         # NextAuth route handler
│   ├── blob/upload/route.ts        # Server-side put() to Vercel Blob (private)
│   ├── extract/route.ts            # Streaming agent: URL fetch OR PDF vision → submitFindings
│   ├── discover/route.ts           # generateObject: synthesize ranked inventory from findings
│   ├── generate-portfolio/route.ts # NDJSON streaming, Sonnet 4.6 generateObject, scaffold-plus-fill, validation, returns assembled file list + previewHtml
│   ├── limits/route.ts             # GET peek of remaining rate-limit counts for the signed-in user
│   └── export-zip/route.ts         # JSZip-packaged download with locked disclaimer
├── auth.ts                     # NextAuth config (jwt + session callbacks expose user.onboardingNarrative and user.displayName)

components/
├── site-nav.tsx                # Sticky nav with marketing/app variants + Server Action signin. App variant exposes Settings link.
├── site-footer.tsx             # Single-line footer with hackathon attribution
├── scout-mark.tsx              # Tiny aubergine SVG glyph
├── grain.tsx                   # Subtle SVG noise overlay (~4% opacity)
├── portfolio-examples/         # Animated portfolio example cards with modal previews
│   ├── portfolio-card.tsx      # Shared card wrapper: auto-fade with stagger + transition variants (fade/slide/dissolve), click-to-open modal
│   ├── portfolio-modal.tsx     # Full-screen modal with browser chrome, in-modal nav (scrolls to data-section targets)
│   ├── maya-card.tsx           # Maya card instance (UX research, fade transition)
│   ├── jordan-card.tsx         # Jordan card instance (SWE, slide transition, dark)
│   ├── riya-card.tsx           # Riya card instance (Product design, dissolve transition)
│   └── portfolios/            # Full portfolio content (mini pages + scrollable full portfolio)
│       ├── maya-portfolio.tsx  # Editorial UX research aesthetic (hero, case studies, about, contact)
│       ├── jordan-portfolio.tsx # Dark-mode developer portfolio (hero, projects, skills, contact)
│       └── riya-portfolio.tsx  # Visual-first product design (hero, work grid, brand system, contact)
├── connect/
│   ├── connector-grid.tsx      # GitHub (mock), Resume (Blob+vision), URL (fetch+model), LinkedIn (placeholder), Run discovery, Generate Portfolio streaming + sessionStorage handoff to /preview
│   ├── findings-view.tsx       # Per-card extraction summary (tagline, projects, skills, links) + NarrationPanel
│   └── inventory-panel.tsx     # Discovery output: headline + ranked items with scores + suggested next, plus Generate Portfolio CTA
└── preview/
    └── preview-client.tsx      # Sticky header, Preview/Code segmented control, iframe srcDoc preview, file tree + code view, Export modal with locked disclaimer

lib/
├── extract-tools.ts            # AI SDK tools: fetchUrl, submitFindings (parsePdf removed, Claude reads PDFs natively)
├── extract-client.ts           # NDJSON stream reader + Findings type (incl. extraction_failed soft-fail event)
├── rate-limit.ts               # Upstash-backed limiter. preflightLimit (peek), recordUsage (consume), peekLimit (snapshot for UI). Per-category buckets (extractResume/Url/Github, discover, generate, upload).
├── use-limits.ts               # Client hook that fetches /api/limits and exposes refresh()
└── portfolio-scaffold/
    └── files.ts                # buildScaffold() returns 8 static files (package.json, tsconfig, next.config, postcss, .gitignore, layout.tsx, globals.css, README) with project name and title interpolated. Do not edit per-user.

docs/                           # PRDs, next-steps appendix, prompt files
.env.example                    # Onboarding template; copy to .env.local
.env.local                      # Gitignored, contains all secrets
```

## Current build state (2026-05-04)

Shipped and working:

- ✅ Editorial landing page with hero, how-it-works summary, closing CTA, footer
- ✅ **Portfolio example cards**: Three horizontal cards (Maya/Jordan/Riya) with left metadata panel (persona context, connectors used, generation time) and right animated portfolio preview. Each card auto-cycles through 4 pages with staggered timing (0s/1.2s/2.4s offsets) and distinct transitions (fade/slide/dissolve). Click opens a full-screen modal with browser chrome, in-modal nav that scrolls to sections, and complete scrollable portfolio. Responsive: stacks vertically on mobile.
- ✅ Standalone `/how-it-works` page (v0-generated, in repo)
- ✅ Google OAuth sign-in via NextAuth
- ✅ Protected `/connect` page with four connector cards
- ✅ **Resume upload flow**: client posts FormData → server `put()` to Blob (private) → `/api/extract` reads via `@vercel/blob` `get()` SDK → Claude Haiku 4.5 receives the PDF as a native file part with vision
- ✅ **URL extraction flow**: `fetchUrl` tool fetches HTML, parses with `node-html-parser`, returns clean text + metadata
- ✅ **Run discovery**: `generateObject` synthesizes ranked inventory (headline, items with scores + actions, suggested next projects)
- ✅ Live agent narration via NDJSON streaming events
- ✅ Inventory display panel with editable Feature/Include/Skip toggles
- ✅ `app/demo/maya/page.tsx` placeholder route (NOT yet pasted with v0 content)
- ✅ **Rate limiting**: Upstash Redis fixed-window limits per Google user email, cost-on-success via `preflightLimit` + `recordUsage`. Current limits documented in Layer 1 §"Rate limiting". Per-category extract buckets (resume/url/github), `GET /api/limits` for UI display, soft-fail messaging on empty extractions/discoveries that does not consume a slot. `RATE_LIMIT_BYPASS_EMAILS` env var (with hard-coded owner fallback) lets solo-dev testing skip the limits.
- ✅ **Supabase Postgres**: user profiles and rate-limit accounting. Schema and routes that read it: TODO document on next session-end update.
- ✅ **`/start` onboarding** screen with single 500-char textarea, persists to JWT via `unstable_update` as `user.onboardingNarrative`, redirects new users from sign-in. `/connect` redirects back to `/start` if narrative missing.
- ✅ **Portfolio scaffold** at `lib/portfolio-scaffold/files.ts`. `buildScaffold(name, title)` returns 8 files (package.json, tsconfig, next.config, postcss, .gitignore, layout.tsx, globals.css, README) ready for assembly with agent-generated components.
- ✅ **`/api/generate-portfolio`**: NDJSON streaming, `claude-sonnet-4-6` `generateObject`, validates each TSX file (default export, no `'use client'`, no em dashes, allowlisted imports), returns assembled file list + self-contained `previewHtml`.
- ✅ **`/preview` page**: sticky header with Preview/Code segmented control, iframe `srcDoc` preview (sandboxed), collapsible file tree + `<pre><code>` viewer, Export modal with the locked disclaimer text.
- ✅ **`/api/export-zip`**: `jszip`-packaged download with `Content-Disposition: attachment`, files namespaced under `<projectName>/`.
- ✅ **`/settings` page**: auth-gated, accessible from the app-variant nav. Account card shows read-only Google email + name with an editable `displayName` override (capped 60 chars, empty clears). Narrative card mirrors `/start` UX and edits `onboardingNarrative` in place. Both use new `updateDisplayName` / `updateNarrative` Server Actions that write to the JWT via `unstable_update` and redirect with `?saved=` for inline confirmation. `displayName ?? name` fallback wired at the three render sites: `/start`, `/connect`, and `/api/generate-portfolio` candidate name.

Known issues / not yet done:

- ⚠️ Preview rendering uses agent-emitted `previewHtml` (full HTML doc with Tailwind CDN) instead of `react-dom/server` against the TSX strings. Documented at the top of `app/api/generate-portfolio/route.ts`. Tradeoff: preview HTML and export TSX are independent strings that should agree visually but aren't byte-identical.
- ⚠️ Anthropic free-tier rate cap (10k tpm on Sonnet 4.6) drove the switch to Haiku 4.5 for extract/discover. Portfolio generation attempts Sonnet 4.6 because output quality matters more there; swap `MODEL` in `app/api/generate-portfolio/route.ts` to `claude-haiku-4-5` if rate-capped.
- ⚠️ No GitHub MCP integration yet (visual-only mock card on `/connect`). May 4 work, prompt at `docs/CLAUDE_CODE_PROMPT_GITHUB_MCP.md`.
- ⚠️ No demo mode (PRD §7.11) wired up beyond the placeholder route. (The landing page portfolio examples are illustrative, not the sign-up-free agent walkthrough the PRD describes.)

## Environment

Local `.env.local` (gitignored) currently has:

```
AUTH_SECRET=...                 ✓ set
AUTH_GOOGLE_ID=...              ✓ set, redirect URIs configured for localhost + scoutfolio.vercel.app
AUTH_GOOGLE_SECRET=...          ✓ set
ANTHROPIC_API_KEY=...           ✓ set, Tier 1 (10k tpm Sonnet, ~50k tpm Haiku)
AI_GATEWAY_API_KEY=...          set but unused (kept for future Gateway switchback)
BLOB_READ_WRITE_TOKEN=...       ✓ set, store is PRIVATE access
SUPABASE_URL=...                ✓ set
SUPABASE_ANON_KEY=...           ✓ set
SUPABASE_SERVICE_ROLE_KEY=...   ✓ set (server-only)
UPSTASH_REDIS_REST_URL=...      ✓ set
UPSTASH_REDIS_REST_TOKEN=...    ✓ set
```

Vercel envs:

- All five original auth/AI envs present in Production + Preview + Development
- `BLOB_READ_WRITE_TOKEN` present in all three
- Supabase + Upstash envs added during DB and rate-limiting build, present in Production + Preview
- After any new env var, redeploy with `vercel deploy --prod --yes` because env changes only apply to new deployments

## What's next, ranked

1. **Real GitHub MCP integration.** Self-contained prompt at `docs/CLAUDE_CODE_PROMPT_GITHUB_MCP.md`. Hand to a fresh Claude Code session before May 4.
2. **Portfolio generator output quality.** Generated portfolios currently produce rudimentary HTML that looks nothing like the illustrative examples on the landing page. Align the generator's output (prompt, scaffold, and validation) to match the visual fidelity of `components/portfolio-examples/portfolios/` (distinct field aesthetics, proper typography, dark-mode SWE variant, editorial structure). This is a trust gap: the landing page promises polish that the actual output doesn't yet deliver.
3. **Demo mode** (PRD §7.11) wired with a real prebuilt fixture so judges can experience the agent without signing up.
4. **GitHub data into discovery** (May 4 scope). Once OAuth is live, wire `lib/github-tools.ts` `fetchUserRepos(token)` into `/api/discover` as a parallel finding source.

## Last words

The two highest-leverage things future you can do here:

1. **Read `docs/SCOUTFOLIO_NEXT_STEPS.md` before any current-increment work, and both PRDs before changing anything substantive.** The May 4 spec sets boundaries that aren't otherwise visible from the code.
2. **Keep the layer boundary intact.** Layer 1 edits drift the project's foundations. Layer 2 edits keep state honest. If you find yourself wanting to change a Locked Convention to make your work easier, surface it to me as a suggestion, don't quietly edit it.