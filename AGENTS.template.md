<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes; APIs, conventions, and file structure may all differ from older training cutoffs. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# Agent onboarding (template)

You are working in a **Next.js App Router** codebase that uses **server-side AI**, optional auth, and **Vercel-shaped** hosting and storage.

## How to use this file when you fork

1. Copy this file to **`AGENTS.md`** at the repo root (your local `AGENTS.md` can stay private; see `.gitignore`).
2. Replace every **`YOUR_*`** placeholder with your real product name, URLs, stack pins, and file paths.
3. Point agents at **your** PRDs or RFCs instead of this template prose.
4. Delete sections that do not apply (Blob, OAuth-only auth, and so on).

This template intentionally avoids reproducing another project's deployment URLs, accounts, internal PRD filenames, or secrets. It only describes **how to scaffold** agent-facing onboarding for a project shaped like this one.

## Describe your product

Give a one-paragraph pitch: who it is for, the core user journey, and what the agent is allowed to optimize for (speed, cost, UX, safety). Link out to a human-maintained spec for boundaries.

## Source-of-truth docs (you maintain these)

List paths under **`YOUR_DOCS/`** (or `/docs`) that agents must read before large changes:

- Product spec or PRD (personas, scope, success metrics, explicit "do not build" list).
- Architecture note or ADR folder if you have one.
- Demo or milestone doc if you are shipping to a deadline.

Avoid checking machine-local paths (for example home-directory plans) into the canonical repo unless everyone shares them.

## Stack (fill in your pins)

| Layer | Your choice |
|---|---|
| Framework | Next.js (App Router) |
| Language | TypeScript (strict) |
| UI | Tailwind CSS 4 with CSS-first tokens (`@theme` in `app/globals.css` or equivalent) |
| React | major version you ship |
| Auth | NextAuth, Clerk, or none |
| AI | Vercel AI SDK (`ai`) plus whichever provider package you use |
| Storage | Vercel Blob, S3-compatible store, or none |
| Hosting | Vercel or other |
| Package manager | pick one and stick to it (this repo uses **pnpm**) |

Add one line on **model choice** (latency versus quality versus budget) and whether you use AI Gateway or a direct provider key.

## Architecture (adapt this tree to your repo)

Use a short tree like below so agents stop guessing where routes and tools live. Rename folders to match reality.

```
app/
├── layout.tsx
├── globals.css
├── page.tsx
├── (your app routes)
├── actions.ts                 # Server Actions if you use them
└── api/
    └── ...                    # Route handlers: streaming, uploads, webhooks

components/
└── ...                        # Prefer Server Components unless interactivity needs client

lib/
└── ...                        # Shared types, AI tools, clients, rate limiting helpers

docs/                          # PRDs, RFCs (optional)
.env.example                   # Names only; copy to .env.local
.env.local                     # Gitignored secrets
```

## Locked conventions (examples you can adopt)

### Design tokens

Prefer **CSS variables** wired through Tailwind (for example `--color-background`, `--color-accent`) so JSX stays semantic (`bg-accent`, `text-muted`). Avoid scattering hex in components.

### Code conventions

- TypeScript strict, avoid `any`.
- Server Components by default; `"use client"` only where needed.
- Keep **AI calls on the server** unless you have a deliberate client-side exception.
- Stream user-visible model output when responses are long or multi-step.
- If you use Zod with Anthropic structured output, confirm which numeric or length constraints the provider accepts; some APIs reject certain schema keywords, so describe limits in field descriptions when needed.

### Scope guardrails

Maintain an explicit **"do not build without confirmation"** list (payments, admin dashboards, email, i18n, and so on) in your PRD so agents do not wander.

## Environment checklist (names only)

Mirror **`YOUR_ENV_TEMPLATE`** (often `.env.example`): list variable names agents should expect, never values.

Typical categories:

- Auth secret and OAuth client IDs if you use Google or similar.
- Model provider API key or Gateway key.
- Blob or object storage read/write token if uploads exist.
- Rate-limit or KV credentials if you throttle AI or uploads.

Note that hosted environments usually need a **fresh deploy** after env changes.

## Common tasks (generic)

| Task | Typical command |
|---|---|
| Install | `pnpm install` or your package manager |
| Dev server | `pnpm dev` |
| Production build | `pnpm build` |
| Deploy | your platform CLI (for example `vercel deploy`) |

## MCP and docs discipline

If your team uses MCP servers (Context7 for library docs, framework devtools, browser tooling), say **when** to prefer them over guessing from memory. Keep provider-specific rules short and linkable.

## Communication defaults for agents

- Lead with approach, then implementation detail.
- Ask clarifying questions only when the answer changes architecture or safety.
- Commit at logical breakpoints.

## Last words

1. **Read your product spec before refactors** that touch UX promises or data boundaries.
2. **Protect AI spend and abuse surfaces**: auth gates, rate limits, upload caps, and observability belong in the same mental bucket as API keys.
