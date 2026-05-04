# ScoutFolio: ship the GitHub MCP integration

You are a Claude Code agent with a fresh context window. Your job is to take ScoutFolio's GitHub connector card from a visual mock to a real, working integration that authenticates a user with GitHub, calls the GitHub Remote MCP server with the user's token, pulls their repositories and READMEs through MCP tools, and feeds those findings into the existing discovery + portfolio generation pipeline. This is the final hackathon-stage feature, deadline May 4, 2026. The bar is "judges click Connect, watch the agent stream tool calls against their real GitHub, and see real repos in the discovery output."

You are not building a generic GitHub integration. You are routing real MCP tool calls through ScoutFolio's existing extract → discover → generate-portfolio pipeline so the demo narrative ("the agent visibly working with multiple Vercel platform pieces") stays intact.

## Read these first, in this order

1. `AGENTS.md` end to end. Both layers. This is non-negotiable. Pay close attention to:
   - Layer 1 §"Code conventions" (Server Components, Zod, no em dashes, no `any`, NDJSON streaming)
   - Layer 1 §"JWT extensions" (`githubToken` is already pre-allocated as a future field)
   - Layer 1 §"Rate limiting" (cost-on-success, `preflightLimit` + `recordUsage`, per-category buckets, the `extractGithub` bucket already exists at 6 per 24h)
   - Layer 2 architecture diagram (you'll be adding files; mirror the existing layout)
2. `docs/SCOUTFOLIO_PRD.md` §11.4 "What Not to Build" so you don't drift into a CMS UI or admin dashboard.
3. `docs/SCOUTFOLIO_NEXT_STEPS.md` for current-increment scope.
4. `app/api/extract/route.ts` and `lib/extract-tools.ts` end to end. The new GitHub source must produce findings in the **same shape** the URL and resume sources produce, so the existing `submitFindings` tool, NDJSON streaming, soft-fail messaging, and rate-limit pattern all continue to work.
5. `components/connect/connector-grid.tsx`. The GitHub card is currently a visual mock; you will wire it to the real flow without disturbing the resume, URL, or LinkedIn cards.
6. `auth.ts` and `app/actions.ts` to see how the existing JWT extension + Server Action pattern works. You will mirror it for `githubToken`.

**Note**: AGENTS.md mentions `docs/CLAUDE_CODE_PROMPT_GITHUB_OAUTH_STRETCH.md`. That file does not currently exist on disk. Don't waste time looking for it. This document supersedes it.

## Fetch current docs via Context7 BEFORE writing any code

Both stacks have shifted recently and your training data is likely wrong on at least one of these APIs. Use the Context7 MCP to resolve and fetch current docs. Do not skip this step. Do not paste API calls from memory.

Required fetches:

1. **NextAuth v5 beta GitHub provider**
   - Resolve: `next-auth` (the `5.0.0-beta.31` line, App Router, JWT sessions)
   - Topics: GitHub provider configuration, the `account` parameter on the `signIn` and `jwt` callbacks, how to surface `account.access_token` onto the JWT, `signIn("github", { redirectTo })` from a Server Action, scope configuration (we need `repo` and `read:user`).
2. **AI SDK v6 MCP client**
   - Resolve: `ai` (v6.x line)
   - Topics: `experimental_createMCPClient` exact import path, transport options (`StreamableHTTPClientTransport` for HTTPS endpoints), how to pass an `Authorization: Bearer <token>` header, how the returned tools plug into `streamText`'s `tools` argument, lifecycle (when to `await client.close()`).
3. **GitHub Remote MCP server**
   - Resolve: `github-mcp-server` or search "GitHub MCP server remote" in Context7 / WebFetch the official docs at https://docs.github.com/en/copilot/customizing-copilot/extending-copilot-chat-with-skillsets/using-the-github-mcp-server (or equivalent current URL).
   - Confirm: the canonical remote endpoint URL (it's `https://api.githubcopilot.com/mcp/` at time of writing but verify), the exact tool names for "list authenticated user repos," "get repository contents / README," "get repository metadata," and which tools are gated behind which scopes. The demo only needs read tools; do NOT enable write tools.
4. **Zod + AI SDK structured output reminder**
   - The Anthropic structured-output limitation (no `minItems > 1`, `maxItems`, `minimum`, `maximum`) still applies. Express constraints in `.describe()`. AGENTS.md Layer 1 §"Code conventions" already documents this.

If Context7 returns stale or thin results for any of the above, fall back to WebFetch on the official docs site and note the source in a code comment at the top of the new file. Do not paste from memory.

## Approach

The integration is **OAuth-per-user → MCP client per request → MCP tools surfaced to the existing AI SDK agent**. Same shape as the URL and resume extract paths, just with a new tool source.

### High-level flow

1. User on `/connect` clicks "Connect GitHub" on the GitHub card.
2. Server Action calls `signIn("github", { redirectTo: "/connect" })`. Existing Google session must survive the GitHub link (NextAuth v5 supports linking via the `account` callback; verify in Context7).
3. After GitHub OAuth completes, the JWT carries `githubToken` (the GitHub `access_token`). The connector card now shows a connected state and unlocks an "Extract from GitHub" action.
4. Clicking extract POSTs to `/api/extract` with `source: "github"`. The route:
   - Authenticates via `auth()` and reads `session.user.githubToken`.
   - Preflight checks the existing `extractGithub` rate-limit bucket.
   - Spins up an MCP client via `experimental_createMCPClient` against the GitHub Remote MCP server, passing the user's token in the `Authorization` header.
   - Streams an agent run via `streamText` (Claude Haiku 4.5, same model the resume + URL paths use) with the MCP tools merged into the existing tool set, instructing the agent to list the user's repos, fetch READMEs for the top N (cap at 8 so we stay under context + token budgets), and call `submitFindings` with the synthesized result.
   - On success, calls `recordUsage("extractGithub", id)`. On any failure mode that produces zero findings (no repos, all repos empty, MCP errors, Anthropic 429), surfaces a soft-fail event that does NOT consume a slot, matching the existing convention.
   - `await client.close()` in a `finally` block.
5. Findings flow into `/api/discover` and `/api/generate-portfolio` exactly like the URL and resume sources do today. No changes needed to those routes; they already accept the unified `Findings` shape.

### Files to create

- `lib/github-mcp.ts` — small helper that constructs the MCP client given a user token, returns `{ client, tools, close }`. Centralizes the endpoint URL, header construction, and any tool-name allowlist filtering so the route file stays readable. Default exports nothing; named exports only. No `any`.
- `app/api/auth/github/disconnect/route.ts` (or a Server Action; pick one) — clears `githubToken` from the JWT via `unstable_update({ githubToken: "" })`. Hook this up to a "Disconnect" affordance on the GitHub card so a user can revoke the link without signing out entirely.

### Files to modify

- `auth.ts` — add the GitHub provider alongside Google. In the `signIn` callback, capture `account.access_token` when `account.provider === "github"` and stash it on the JWT. In the `jwt` callback, persist `githubToken` across requests. Update the `Session.user` type augmentation to include `githubToken?: string`. Mirror the `displayName` / `onboardingNarrative` pattern exactly.
- `app/actions.ts` — add `connectGitHub()` Server Action that calls `signIn("github", { redirectTo: "/connect" })`. Add `disconnectGitHub()` Server Action that calls `unstable_update({ githubToken: "" })` then `redirect("/connect")`.
- `app/api/extract/route.ts` — add the `source === "github"` branch. Reuse the existing NDJSON streaming, narration events, soft-fail event shape, and rate-limit consume-on-success pattern. Do not duplicate the streaming scaffolding; refactor only if necessary.
- `lib/extract-tools.ts` — register a new `submitFindings` shape variant only if the GitHub tools require it; otherwise the existing tool already handles project + skill + link arrays. Verify by reading the tool's Zod schema.
- `components/connect/connector-grid.tsx` — replace the mock GitHub card with the real connect/extract/disconnect UX. Match the visual language of the resume and URL cards (the same eyebrow + headline + body + button + remaining-count line). Show three states: not connected, connected (with extract button + disconnect link), extracting (with `NarrationPanel`), done (with `FindingsView`). Reuse `useLimits()` for the per-card "X of N left today" line.
- `components/connect/findings-view.tsx` — only modify if the new findings shape introduces fields the current view does not render (e.g. repo URL with star count). Prefer not to touch.
- `app/connect/page.tsx` — no changes expected. The existing auth + narrative gates are sufficient.

### Files NOT to touch unless absolutely necessary

- `app/api/discover/route.ts`, `app/api/generate-portfolio/route.ts`, `app/api/export-zip/route.ts`, `app/preview/*`, `lib/portfolio-scaffold/*`. These already consume the unified findings shape and produce final output. If you find yourself editing them, stop and reconsider; you've probably broken the seam.
- `app/settings/*`. Out of scope.
- `app/start/*`. Out of scope.
- Layer 1 of AGENTS.md. Locked. If you believe a Locked Convention needs to change, surface the proposal and stop.

## Environment

You will need three new environment variables added to `.env.local` AND to Vercel envs (Production + Preview + Development):

```
AUTH_GITHUB_ID=...
AUTH_GITHUB_SECRET=...
GITHUB_MCP_ENDPOINT=https://api.githubcopilot.com/mcp/   # confirm exact URL via Context7 / official docs
```

The user (Aaron) must register a GitHub OAuth App at https://github.com/settings/developers with:
- Homepage URL: `https://scoutfolio.vercel.app`
- Authorization callback URL: `https://scoutfolio.vercel.app/api/auth/callback/github` and the localhost equivalent for dev.
- Scopes requested at sign-in: `repo` (read access is in `public_repo`, but `repo` is needed to surface private project work) and `read:user`.

You cannot create the OAuth App for him. Print the registration steps in your final report so he can do it before deploying. Locally, you can validate the integration end-to-end once the secrets are in `.env.local`.

After adding env vars to Vercel, redeploy with `vercel deploy --prod --yes` because env changes only apply to new deployments (per AGENTS.md §"Common tasks").

## Rate limiting

The `extractGithub` bucket already exists at 6 per 24h (Layer 1 §"Rate limiting"). Use it as-is. Cost-on-success only. Soft-fail (zero repos, all empty, MCP transport error, Anthropic 429, validation failure) does NOT consume a slot and surfaces a one-line message ending with "your usage wasn't affected."

The `GET /api/limits` peek endpoint already exposes `extractGithub`. Verify it shows up correctly in the new card's "X of N left today" line.

Do not add new buckets. Do not change existing limits.

## Conventions to maintain

Pulled from AGENTS.md Layer 1. Non-negotiable.

- Server Components by default. `"use client"` only for the connector-grid interactivity that's already there.
- All AI calls server-side.
- Stream all user-facing AI output via NDJSON. Use the existing event shape (`status`, `tool_call`, `findings`, `extraction_failed`, `done`).
- Zod for schemas. No `minItems > 1`, `maxItems`, `minimum`, `maximum`. Constraints in `.describe()`.
- TypeScript strict, no `any`. If a third-party type is loose, narrow it with a Zod parse at the boundary, not a cast.
- No em dashes anywhere (commas, semicolons, slashes, middle dots are fine). Same in JSX text content. No `&mdash;`.
- No hardcoded hex in JSX. Use `bg-accent`, `text-muted`, `border-border`, etc.
- Subtle hover lifts only. No glassmorphism, no decorative gradients, no emoji.
- Default to no code comments. Only add a comment when WHY is non-obvious (e.g. "Anthropic structured-output rejects maxItems; constraint moved to .describe()" is a valid comment).

## Verification (you must run all of these before declaring done)

1. **Context7 fetched docs are current.** Print the source URL/version for each of NextAuth GitHub provider, AI SDK MCP client, GitHub MCP server in your final report.
2. **`pnpm build`** passes with zero TypeScript errors. The augmented `Session` type with `githubToken` must compile cleanly.
3. **`pnpm dev`** runs locally without console errors after sign-in.
4. **Manual end-to-end check** (you cannot do this without Aaron, so write the script for him):
   - Sign in with Google.
   - Submit a narrative on `/start`.
   - On `/connect`, click "Connect GitHub", complete the GitHub OAuth.
   - Click "Extract from GitHub". Observe NDJSON narration showing real MCP tool calls (`list_repositories`, `get_file_contents` or equivalent) against his account.
   - See findings populate with real repo names, descriptions, and a tagline derived from his READMEs.
   - "X of 6 left today" updates to 5.
   - Click "Run discovery". GitHub findings should appear in the inventory ranking alongside any URL/resume findings.
   - Click "Generate Portfolio". The candidate's hero/projects sections should reference real repos by name.
   - Click "Disconnect". Card returns to "Connect GitHub" state, JWT no longer carries the token.
5. **Failure modes you must demonstrate handle gracefully** (not necessarily during the demo, but the code paths exist):
   - Token revoked from GitHub side: surface "Reconnect required," do not consume a rate-limit slot.
   - User has zero public repos: surface "No accessible repositories found, your usage wasn't affected."
   - MCP transport timeout: surface a soft-fail with the rate-limit slot preserved.
   - Anthropic 429: same soft-fail treatment as the existing routes.

## Session-end protocol (per AGENTS.md)

After verification passes, you MUST update Layer 2 of AGENTS.md per the protocol on lines 45-52:

1. Re-read AGENTS.md end to end.
2. Identify drift between observed reality and documented state.
3. Propose surgical edits to Layer 2 only:
   - Architecture diagram: add `lib/github-mcp.ts`, the new auth route, the GitHub provider on `auth.ts`'s comment, the Server Actions added to `app/actions.ts`.
   - Update `## Current build state` with a `✅` bullet for the GitHub MCP integration. Date stamp to today.
   - Move "No GitHub MCP integration yet" out of Known issues.
   - Update "What's next, ranked" to remove the GitHub OAuth item and surface the next priority (likely demo mode or generator output quality).
4. **Layer 1 proposals require explicit user confirmation.** The `githubToken` JWT extension is already pre-allocated in Layer 1 §"JWT extensions" Future fields. After this work ships, propose moving it from "Future fields" to "Current fields" and update the description with the actual setter (the GitHub Server Action) and reader (the new extract source). Do not edit Layer 1 yourself. Print the diff for Aaron to confirm.
5. Show Aaron the Layer 2 diff. Apply only after he says yes.

## What to include in your final report

- Source URLs/versions for the three Context7 / docs fetches.
- A short summary of what you shipped, in the same voice as AGENTS.md (terse, no em dashes, no marketing).
- The exact GitHub OAuth App registration steps Aaron needs to complete.
- The three env vars he needs to add to Vercel.
- The proposed Layer 2 diff (apply after confirmation) and the proposed Layer 1 §"JWT extensions" diff (do not apply, propose only).
- Anything you punted on, with a clear rationale (e.g. "deferred private repo support because the demo only needs public repos and `repo` scope is a bigger ask in the OAuth screen than `public_repo`").
- A 30-second demo script Aaron can read off during the hackathon presentation.

## Out of scope (deliberately, do not let scope creep happen)

- Figma MCP. Will be a separate prompt. Do not add scaffolding for it.
- A generic "MCP connector framework." YAGNI. Hard-code the GitHub MCP path, build the abstraction only if a second integration ships and the duplication is real.
- Persisting the GitHub token to Supabase. JWT-only is the documented pattern in AGENTS.md §"JWT extensions."
- Editing Layer 1 of AGENTS.md.
- Replacing the existing Google sign-in flow. GitHub is a *secondary* link; primary auth stays Google.
- Replacing or modifying `/api/discover` or `/api/generate-portfolio`. The seam is the unified `Findings` shape; respect it.
- A demo mode (PRD §7.11). Separate work.

## If you get stuck

If you hit a real blocker (e.g. AI SDK v6 MCP client API surface differs from what Context7 returned, or the GitHub Remote MCP server requires an OAuth flow type that NextAuth's GitHub provider doesn't support out of the box), STOP and surface the blocker to Aaron with:

- What you tried.
- What the actual error / API surface is.
- Two alternative paths forward, ranked by effort and risk.

Do not silently downgrade to a non-MCP REST integration. The MCP narrative is the entire point of this work. If real MCP is unworkable for the hosted GitHub server in the time available, the correct fallback is "ship a tightly scoped local MCP wrapper that proxies to the GitHub REST API," not "skip MCP entirely." Surface the choice; don't make it unilaterally.

Begin by reading AGENTS.md end to end and then issuing the Context7 fetches. Do not write code until both are done.
