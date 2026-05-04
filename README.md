# ScoutFolio

An AI portfolio-builder for students. Connect your GitHub, resume, and personal sites; an agent reads everything, judges what's portfolio-worthy, writes recruiter-facing copy, and ships you a personal site you'd actually share.

Built for Vercel's "Zero to Agent" hackathon. Live at **https://scoutfolio.vercel.app**.

---

Most portfolio tools give you a blank canvas and a drag-and-drop editor. That's fine if you know what to put in it. But most students don't. They have three years of coursework, a handful of side projects, an internship or two, and no idea which parts a recruiter actually cares about — or how to talk about any of it. The result is either a portfolio that undersells them, or no portfolio at all.

ScoutFolio skips the blank canvas entirely. Instead of asking you to fill in a template, it reads the work you've already done — your GitHub repos, your resume, your existing sites — and figures out what's worth highlighting. An AI agent writes the copy, picks the visual theme, and hands you a finished site. Not a rough draft to clean up. Something you'd actually send.

The part that makes this different from just "paste your info and get a site" tools: the agent doesn't treat your inputs as form fields. It reads your GitHub READMEs the same way a curious person would, notices which projects have substance and which are throwaway homework, pulls your strongest talking points from your resume, and synthesizes all of it into a ranked inventory before any portfolio gets written. The generation step is informed, not mechanical.

The other part: you're not locked into what the agent produces. The preview comes with a chat panel. You talk to the portfolio like you'd talk to a designer — "make it darker," "the about section sounds too formal," "lead with the internship instead" — and it updates live. Every change is reversible. When you're done, you export a real, deployable project you can host anywhere.

---

## How it works

ScoutFolio takes a student from "I have no portfolio" to "I have a deployable, recruiter-ready personal site" in a few steps:

1. **Connect your sources.** Upload a resume PDF, paste your GitHub username, and add any personal URLs (portfolio sites, project pages, etc.). You can connect as many or as few as you want.

2. **The agent reads everything.** Each source is extracted independently with streaming narration so you can watch it work in real time. GitHub uses the GitHub MCP to actually read your repository READMEs, not just scrape metadata. Resume PDFs are read natively with AI vision. Personal URLs are fetched and parsed server-side.

3. **Run discovery.** Once your sources are connected, a synthesis agent reads across all your findings and produces a ranked inventory: your strongest projects, skills, and talking points, scored and ready to review.

4. **Generate your portfolio.** One click kicks off the portfolio agent. It writes all the content (hero, projects, about, contact) and picks a visual theme (typeface trio, color palette, light vs. dark mode) based on your field and narrative. The result is a real, deployable Next.js project.

5. **Edit in the preview.** A left-rail chat panel lets you refine the portfolio conversationally. Ask to change the tone, update the color scheme, or rewrite a section. Every edit streams back a full updated preview. An undo stack lets you step back through changes. When you're happy, export as a zip.

## Features

- **Resume extraction** via native AI PDF vision (no conversion, no OCR)
- **GitHub MCP integration** — OAuth-connected, reads actual README content from your repos via the GitHub MCP protocol
- **Multi-URL support** with automatic deduplication (paste your portfolio site, a project page, a blog, etc.)
- **Workspace persistence** — findings survive sign-out and page reloads; everything is stored per-user
- **Streaming agent narration** across all extraction, discovery, and generation steps
- **Portfolio generation** with structured content output; ScoutFolio assembles the final code deterministically
- **Theme system** — the agent chooses from a curated palette and font registry; light and dark modes supported
- **Chat-driven editor** in the preview with conversational edits and a 5-step undo stack
- **Export as zip** — a complete Next.js project you can deploy anywhere
- **Per-user daily quotas** to keep API costs bounded
- **Google OAuth** sign-in; optional GitHub OAuth to enable the MCP extraction path

## Pages

| Route | What it is |
|---|---|
| `/` | Landing page with three animated example portfolios (UX research, software engineering, product design) |
| `/how-it-works` | Three-step explainer |
| `/demo` | Judge-facing page with walkthrough video and four-stage explainer |
| `/start` | Onboarding: tell ScoutFolio a sentence or two about yourself |
| `/connect` | The main workspace: connect sources, run extraction, run discovery, generate your portfolio |
| `/preview` | Live preview with code view, chat editor, and zip export |
| `/settings` | Edit your display name and onboarding narrative |

## Stack

- **Next.js** (App Router) + **React** + **TypeScript strict**
- **Tailwind CSS 4** (CSS-first `@theme` config)
- **NextAuth v5** with Google and GitHub providers, JWT sessions
- **Claude API** for all AI work (extraction, discovery, generation, edits)
- **GitHub MCP** for reading repository content
- **Vercel Blob** for private resume storage
- **Upstash Redis** for workspace persistence, user profiles, and rate limiting
- **Vercel Functions** for all streaming agent routes
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

| Variable | What it is |
|---|---|
| `AUTH_SECRET` | NextAuth session encryption key (`openssl rand -base64 32`) |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | Google OAuth credentials (Google Cloud Console) |
| `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET` | GitHub OAuth credentials (optional, enables GitHub MCP extraction) |
| `ANTHROPIC_API_KEY` | Claude API key |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob token (private store for resume PDFs) |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis (workspace, profiles, rate limits) |

Authorized redirect URIs to configure in Google Cloud Console:

- `http://localhost:3000/api/auth/callback/google`
- `https://<your-domain>/api/auth/callback/google`

## Deploying

```bash
vercel deploy --prod --yes
```

Env changes in the Vercel dashboard only apply to new deployments, so always redeploy after editing them.

## Abuse protection

ScoutFolio has per-user daily quotas backed by Upstash Redis (sliding window, keyed on Google account). Limits are checked before any AI call is made; failed or empty extractions don't count against the quota. A Vercel Firewall rule caps anonymous burst traffic at the IP level before auth checks even run. Standard security headers (CSP, referrer policy, frame options) ship on every route.

## Project layout

```
app/api/extract/          # Streaming extraction: URL, PDF, or GitHub MCP
app/api/discover/         # Discovery synthesis across all sources
app/api/generate-portfolio/ # Portfolio generation (structured content + theme)
app/api/edit-portfolio/   # Chat-driven edits to an existing portfolio
app/api/export-zip/       # Zip packaging for download
app/connect/              # Main workspace page
app/preview/              # Preview, code view, chat editor, export
components/connect/       # Connector grid, findings views, inventory panel
components/preview/       # Preview client with chat rail and undo stack
lib/portfolio-scaffold/   # Static scaffold + templates + compose + schema + themes
lib/workspace.ts          # Redis-backed per-user artifact storage
lib/github-mcp.ts         # GitHub MCP client + REST repo prefetch
lib/profiles.ts           # Redis-backed user profile (narrative, display name)
lib/rate-limit.ts         # Upstash quota enforcement
docs/                     # PRDs and build appendix
```

## Documentation

- `docs/SCOUTFOLIO_PRD.md` — full v1.0 product spec
- `docs/SCOUTFOLIO_2HR_DEMO_PRD.md` — live-event demo scope

## License

Private (hackathon submission). License TBD post-hackathon.
