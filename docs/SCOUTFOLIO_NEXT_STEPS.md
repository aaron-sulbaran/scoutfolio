# ScoutFolio — Next Steps

**Version:** 0.1 (Build Increment)
**Last Updated:** April 27, 2026
**Status:** Active Build
**Companion to:** `AGENTS.md` (repo root), `docs/SCOUTFOLIO_PRD.md` (v1.0), `docs/SCOUTFOLIO_2HR_DEMO_PRD.md` (v0.1)

---

## What this document is

This is a working appendix that lives alongside `AGENTS.md`. Read AGENTS.md first. This file only adds: what's being built right now, why, and the constraints specific to this increment. When the increment ships, fold its contents into `SCOUTFOLIO_PRD.md` v1.1 and archive this file under `docs/archive/`.

Agents (Claude Code, Cursor) should treat this file as authoritative for the current scope and AGENTS.md as authoritative for everything else.

## What is shipping in this increment

Three connected capabilities that turn the current "discovery only" experience into a complete generation loop:

1. **Portfolio generation agent** that takes the user's reviewed inventory and produces a complete, deployable Next.js portfolio project as a list of files.
2. **Portfolio preview page** styled after a Claude artifact (or v0): rendered preview by default, code-view toggle in a sticky header, export action.
3. **Zip export** that packages the generated project as a download, with an honest disclaimer about what's in the zip.

Plus one bonus inclusion that was thinly specified in v1.0:

4. **Lightweight onboarding screen** at `/start` with a single textarea capturing "who I am, what I'm looking for." Persisted to JWT, read by the discovery and portfolio-generation agents as user context.

Out of scope for this increment (handled separately or in May 4 work):

- GitHub OAuth (separate stretch-goal prompt exists)
- Real GitHub data ingestion into the discovery agent
- GitHub MCP integration
- Multi-template support beyond the first one
- Custom domain or deploy-to-Vercel
- Conversational multi-step onboarding (the textarea is in scope; the multi-step flow is not)
- LinkedIn integration
- Rate limiting (next session)

## Why this scope

The current product successfully gets a user from sign-in to a reviewed inventory, but the inventory is the end of the road. Judges and users will ask "okay, but what does it produce?" and the honest answer right now is "nothing yet." Shipping the portfolio output closes the loop.

Building the agent in isolation against the existing inventory data is also low-risk. The inventory is already produced by `/api/discover`, persisted in component state, and rendered in `inventory-panel.tsx`. The new code consumes that data without touching any of the existing extract or discovery logic.

## Capability 1 — Portfolio Generation Agent

### What it does

Takes the reviewed inventory plus the user context (resume content, narrative from `/start`, target role) and produces a complete file tree for a single-page Next.js portfolio site. Output is a list of `{ path, content }` records.

### Where it lives

`app/api/generate-portfolio/route.ts`. Streaming NDJSON for status events (matching the `/api/extract` and `/api/discover` patterns), terminating with a `complete` event that contains the assembled project.

### Model choice

Anthropic Claude Sonnet 4.6 via `@ai-sdk/anthropic@3`. Same API key pipeline as the rest of the app.

**Note:** AGENTS.md flags that the extract pipeline is on Haiku 4.5 due to free-tier rate caps on Sonnet 4.6. Portfolio generation should still attempt Sonnet 4.6 first because output quality matters more here. If you hit the 10k tpm ceiling consistently during build/test, fall back to Haiku 4.5 with a one-line provider model swap and document the decision in the route file's top comment. Opus 4.7 is the second fallback if Haiku quality is visibly worse.

Auto-mode in Claude Code is unrelated to the model selection in this Next.js API route. The route calls Sonnet 4.6 directly via the AI SDK; the lack of Sonnet auto-mode in Claude Code does not block this build.

### Generation strategy: scaffold-plus-fill

The agent does NOT generate the entire project from scratch each time. That is unreliable, slow, and expensive. Instead:

1. A static scaffold of files (Next.js config, package.json, tsconfig, layout, globals.css, README, blank `app/page.tsx`) lives in `lib/portfolio-scaffold/files.ts`. Agent never touches these.
2. The agent's only job is to fill in the components that depend on user content: hero, projects, about, contact, plus the top-level `app/page.tsx` that composes them.
3. The agent produces these as a small set of TypeScript React Server Components with hardcoded content (no props), using the same color tokens and typography as ScoutFolio for visual consistency.
4. The route assembles the static scaffold + agent-generated components into the final file list and returns it.

This makes generation faster, cheaper, and far more reliable. The agent is constrained to a small surface area where it cannot break the build by hallucinating import paths or inventing unsupported APIs.

### Input shape

POST body:

```ts
{
  inventory: InventoryItem[]   // existing type from /api/discover; only items where action !== "skip"
  user: {
    name: string
    headline: string             // from inventory synthesis
    targetRole: string           // from /start onboarding text (or fallback "Builder")
    narrative: string            // from /start onboarding free-text
    contact?: { email?, github?, linkedin?, website? }  // best-effort from extracted findings
  }
}
```

### Output shape

The Zod schema for `generateObject`:

```ts
z.object({
  hero: z.string().describe("Full TypeScript content for app/components/hero.tsx"),
  projects: z.string().describe("Full TypeScript content for app/components/projects.tsx"),
  about: z.string().describe("Full TypeScript content for app/components/about.tsx"),
  contact: z.string().describe("Full TypeScript content for app/components/contact.tsx"),
  page: z.string().describe("Full TypeScript content for app/page.tsx that imports and composes the four components"),
  meta: z.object({
    name: z.string().describe("Project slug, kebab-case, derived from user's name"),
    title: z.string().describe("Browser tab title for the portfolio"),
  }),
})
```

Anthropic structured-output constraint reminder from AGENTS.md: no `minItems > 1`, `maxItems`, `minimum`, or `maximum`. Express constraints in `.describe()` text instead.

### Validation after generation

Each generated file is validated before assembly:

- Must include a default export
- Must NOT contain `"use client"`
- Must NOT contain em dashes (regex check, per AGENTS.md convention)
- Must NOT contain imports outside the allowlist (`react`, sibling generated components)

If validation fails on any file, return a NDJSON error event with the specific file and reason. Do not auto-fix in this increment.

### Streaming UX

NDJSON event types, matching the established pattern:

- `status` — short human-readable progress message ("Drafting your hero...", "Writing project copy...")
- `file_complete` — emitted when a file is generated, includes the path
- `complete` — final event, contains the assembled project (scaffold + generated)
- `error` — emitted on failure with a user-readable message

The narration in the UI reuses the same NarrationPanel component already established in `components/connect/findings-view.tsx`.

## Capability 2 — Portfolio Preview Page

### Route

`app/preview/page.tsx`. Auth-gated like `/connect`. Reads the generated portfolio from `sessionStorage` on mount; if missing, redirects to `/connect` with a message.

### Layout (Claude artifact / v0 style)

The page mimics a Claude artifact and v0 preview:

**Sticky header bar** at the top, three regions:

- Left: small back arrow to `/connect`, ScoutFolio mark, project name in `text-foreground`
- Center: segmented control with Preview and Code options. Active state uses `bg-accent/10 text-accent`, inactive uses `text-muted`. Smooth toggle.
- Right: file count indicator in `text-muted` ("12 files"), Export button in `bg-accent text-accent-foreground`

**Main canvas** below the header fills the rest of the viewport:

- When **Preview** active: an iframe rendering the generated portfolio
- When **Code** active: file tree on the left (collapsible folders, max-width ~240px), syntax-highlighted code on the right

### Preview rendering: server-rendered HTML

For the 2-hour build, render the preview as a server-rendered HTML snapshot. Specifically:

- The `/api/generate-portfolio` route returns a `previewHtml` field alongside the file list
- This HTML is produced server-side using `react-dom/server`'s `renderToString` against the generated component code, with the scaffold's globals.css inlined in a `<style>` tag
- The client displays this in an iframe via `srcdoc`, which gives free style isolation

If `renderToString` against agent-generated JSX strings turns out to require an in-memory transpile (likely, since the JSX needs to be evaluated, not just templated), fall back to:

**Fallback A: Inline render on /preview itself.** Render the generated portfolio's components inline in `/preview` inside a `<div>` with `isolation: isolate` and the scaffold's CSS scoped. Loses the iframe but ships reliably.

**Fallback B: Static screenshot via Playwright.** Skip for this increment. Too much infrastructure.

Recommended: try the iframe + srcdoc approach first with a server-side render of the agent's `app/page.tsx` content. If you hit a wall in the first 15 minutes of the preview phase, switch to inline render. Document whichever approach you ship with a comment at the top of `app/preview/page.tsx`.

### Code view

When the user toggles to Code:

- Left pane: file tree of the generated project, folders pre-expanded, click a file to select. Default selection: `app/page.tsx`.
- Right pane: read-only code with syntax highlighting. Use `shiki` if it installs cleanly under 5 minutes. Otherwise plain `<pre><code>` with monospace styling. Do not pull in Monaco or CodeMirror.

### Export modal

Triggered by the header Export button. Centered modal:

**Locked disclaimer text (do not paraphrase):**

> This zip contains a Next.js project generated from the inventory you just reviewed. Nothing else. The code is yours to modify, deploy anywhere, no attribution required.

**Actions:** Cancel link in `text-muted`, Download button in `bg-accent text-accent-foreground`.

On Download click: POST to `/api/export-zip`, receive blob, trigger browser download via temporary `<a>`, close modal.

## Capability 3 — Zip Export

### Route

`app/api/export-zip/route.ts`. POST, accepts `{ files: Array<{ path, content }>, projectName: string }`.

### Implementation

Use `jszip` (`pnpm add jszip`). Stream the response as a blob:

```ts
const zip = new JSZip()
for (const file of files) {
  zip.file(`${projectName}/${file.path}`, file.content)
}
const blob = await zip.generateAsync({ type: "nodebuffer" })
return new Response(blob, {
  headers: {
    "Content-Type": "application/zip",
    "Content-Disposition": `attachment; filename="${projectName}.zip"`,
  },
})
```

### Project structure inside the zip

```
<project-name>/
├── README.md                    # Friendly setup, run, deploy, customize instructions
├── package.json
├── tsconfig.json
├── next.config.ts
├── postcss.config.js
├── .gitignore
├── app/
│   ├── layout.tsx
│   ├── page.tsx                 # Generated by agent, composes the four components
│   ├── globals.css              # Same color tokens as ScoutFolio
│   └── components/
│       ├── hero.tsx
│       ├── projects.tsx
│       ├── about.tsx
│       └── contact.tsx
└── public/
    └── (empty for now)
```

The README in the zip is a starter-template README, not a marketing pitch. Friendly tone. How to install, run dev, deploy to Vercel, where to edit content, color tokens explained.

## Capability 4 — Onboarding Screen at `/start`

A single screen between sign-in and `/connect` capturing one free-text input:

> "First, who are you?"
>
> "In a sentence or two, tell us who you are and what you're looking for. The agent uses this to decide what to feature."
>
> [textarea, max 500 chars]
>
> Placeholder: "I'm an electrical engineering student pivoting to product management. Looking for PM internships at consumer tech companies."
>
> [Continue button]

Persistence: store on the NextAuth JWT via the `jwt` and `session` callbacks in `app/auth.ts`. No DB. Read it server-side in the discovery and portfolio-generation routes as user context.

After successful Google sign-in, redirect to `/start` if the user has not yet completed onboarding (token field is empty), otherwise to `/connect`. This logic lives in the existing `signInWithGoogle` Server Action in `app/actions.ts`.

This is the smallest possible improvement to onboarding that materially improves agent output. The full conversational multi-step flow stays in the May 4 spec.

## Sequencing within the 2-hour window

| Phase | Time | Outcome |
|---|---|---|
| Onboarding screen + JWT persistence | 0:00 - 0:20 | New `/start` route with textarea, persists to JWT, redirects flow updated |
| Static portfolio scaffold | 0:20 - 0:35 | `lib/portfolio-scaffold/files.ts` exports all non-generated files |
| Portfolio generation API route | 0:35 - 1:05 | `/api/generate-portfolio` streaming, agent fills components, validation passes |
| Preview page shell + Preview/Code toggle + iframe preview | 1:05 - 1:35 | `/preview` renders generated HTML, toggle works |
| Code view with file tree + syntax highlighting (or plain pre) | 1:35 - 1:50 | Code mode renders all files, file tree navigates |
| Export modal + zip route + download | 1:50 - 2:00 | End-to-end zip download works |

If you fall behind, cut order:

1. Drop syntax highlighting in code view, plain `<pre>` is fine for demo
2. Drop the file tree, just show `app/page.tsx`
3. Drop the iframe preview, render inline on `/preview` itself
4. Skip the `/start` screen, hardcode user context from session for the demo

## Risks and mitigations

- **Risk:** Agent generates broken JSX. **Mitigation:** Tight component-level scaffold, structured output schema, validate that each generated file passes file-level checks before assembling.
- **Risk:** In-browser bundling for live preview is too brittle. **Mitigation:** Default to server-rendered HTML preview from the start. Skip in-browser bundling entirely for this increment.
- **Risk:** Sonnet 4.6 hits the 10k tpm ceiling. **Mitigation:** Documented fallback to Haiku 4.5 with one-line model string change. Test once during build.
- **Risk:** Zip download fails on production due to response size. **Mitigation:** Zip stays under 100kb for a typical portfolio. Test on production deploy before demoing.

## Definition of done

- User completes Google sign-in and lands on `/start` (first-timer) or `/connect` (returning)
- New users complete the onboarding textarea, click Continue, land on `/connect`
- User uploads resume, runs discovery, sees inventory
- User toggles items between Feature/Include/Skip
- User clicks "Generate portfolio" CTA below the inventory panel
- Routed to `/preview`, sees live narration of the agent working
- Within ~30s, preview renders showing a populated portfolio
- User toggles to Code, sees the file tree, navigates a few files
- User clicks Export, sees the disclaimer modal, clicks Download, receives a working zip
- Downloaded zip extracts, `pnpm install && pnpm dev` runs, the site loads at localhost:3000
- All of the above works on the production Vercel URL, not just locally

## What to fold back into the main PRD when this ships

- Mark §7.9, §7.10, and §7.11 of `SCOUTFOLIO_PRD.md` as shipped
- Note the partial implementation of §7.3 (single-textarea onboarding only)
- Update changelog with the v0.1 increment date
- Archive this file to `docs/archive/`
