# ScoutFolio — Product Requirements Document

**Version:** 1.0  
**Last Updated:** April 26, 2026  
**Status:** Draft  
**Owner:** Aaron  
**Hackathon:** Vercel "Zero to Agent" — Track: v0 + MCPs  
**Deadline:** May 4, 2026

---

## Changelog

| Version | Date         | Changes                                                          |
|---------|--------------|------------------------------------------------------------------|
| 1.0     | Apr 26, 2026 | Initial draft. Scope locked for hackathon submission.            |

---

## 1. Executive Summary

ScoutFolio is an agentic web app that takes students from "I have no portfolio and don't know where to start" to "I have a beautiful, recruiter-ready personal site" without forcing them to do the hardest parts themselves: figuring out what work to include and how to talk about it.

Students connect their existing accounts (GitHub, Figma, resume upload, personal URLs) via one-click MCP-powered integrations. An agent then performs multi-source discovery, judges each piece of work against the student's stated career goals, writes recruiter-facing copy for everything worth featuring, and assembles a live-preview portfolio site themed for their field. The student reviews, edits, and exports the final site as deployable code.

The product is built for the Vercel "Zero to Agent" hackathon under the v0 + MCPs track and ships as a deployed Next.js app on Vercel powered by the Vercel AI SDK.

---

## 2. Product Vision

Every student who has ever shipped a project, written a paper, designed a flyer, or built a side hustle has a portfolio hiding inside their existing accounts. The work already exists. The barrier is curation and storytelling, and that barrier is exactly what AI agents are good at removing.

In the world where ScoutFolio succeeds, no student ever again sits in front of a blank Squarespace template wondering what to put on their personal site. They click three buttons, watch an agent narrate its way through their work, edit what they want, and walk away with a portfolio that gets them the interview.

---

## 3. Problem Statement

Students struggle to build personal portfolios for three reasons that compound:

**Discovery is hard.** Most students forget half of what they've done. The hackathon project from sophomore year, the side repo from a slow weekend, the design exercise they posted on Behance once and never linked again. Existing portfolio tools assume the student already has a curated list of work, which is exactly the assumption that breaks.

**Storytelling is harder.** Even when students remember what they've done, translating "I built a CRUD app for a class" into "Designed and shipped a full-stack inventory tool serving 40 student users" is a skill most students don't have. Recruiter-facing copy is a different language than student-facing copy, and writing it requires knowing what recruiters care about.

**Generic AI tools don't solve this.** A student could open ChatGPT and paste in their resume, but ChatGPT can't go look at their GitHub, can't see what they actually built, can't judge whether the project is portfolio-worthy. Existing portfolio builders (Wix, Framer, Squarespace) are content-agnostic, so they make the empty-canvas problem worse, not better.

The market gap is an agent that does the discovery, the judgment, and the storytelling, then hands the student a portfolio they can ship.

---

## 4. Target Users

### Primary Persona: The Career-Pivoting Builder

- **Who they are:** Undergraduate or recent-graduate students whose major or current path doesn't perfectly match their target career. Engineering students aiming at PM. CS students aiming at design. Business students aiming at technical product roles.
- **What they need:** A portfolio that tells a clear story about why they're qualified for the role they want, even when their resume on paper says something different.
- **What frustrates them today:** Generic portfolio templates assume linear careers. Resume bullet points don't translate to portfolio narratives. They have real work to show but don't know how to frame it for the audience they're trying to reach.
- **How they discover ScoutFolio:** Hackathon submission visibility, Twitter/X, university subreddits, career services, word of mouth among student builders.

### Secondary Persona: The Technical Student Going Technical

- **Who they are:** CS, SWE, and engineering students applying to technical internships and full-time roles.
- **What they need:** A portfolio that surfaces their best technical work and reads like a "hire me" pitch to a senior engineer.
- **What frustrates them today:** GitHub profiles are messy. README quality varies wildly. Personal websites take a weekend they don't have. They've shipped real things but they're buried in 80 forked repos.

### Tertiary Persona: The Creative Student

- **Who they are:** Design, art, and creative-discipline students.
- **What they need:** A visually distinctive portfolio that showcases craft, not just content.
- **What frustrates them today:** Tools like Cargo and Squarespace have a learning curve. Behance and Dribbble are platforms, not portfolios.
- **Note:** Supported in v1.0 but lower priority than the two builder personas. The generated template should still look strong for them but P0 polish goes to the builder use case.

### What unifies all three

The onboarding flow learns who the user is and what they want. The agent's judgment, copy, and template choices adapt accordingly. We do not hardcode a single persona into the product.

---

## 5. Solution Overview

ScoutFolio is a Next.js web app that walks a student through five stages:

1. **Hero and trust-building landing page** — visually rich, with real-looking example portfolios that defeat the "AI slop" objection on first impression.
2. **Conversational onboarding** — agent learns who the student is, what role they're targeting, what kind of vibe they want for their portfolio.
3. **Source connection** — one-click connectors to GitHub, Figma, resume upload, and personal URL crawl. LinkedIn shown as "coming soon."
4. **Agent discovery and curation** — agent runs in real time, narrates its progress, and produces a ranked inventory of work with recruiter-facing copy.
5. **Inventory review and portfolio generation** — student reviews, edits, and approves the inventory. Agent generates a live-preview portfolio site. Student exports as deployable Next.js code or deploys to their own Vercel account.

The defensibility of this product over generic LLM tools comes from three places: real multi-source data ingestion via MCPs, judgment that's specific to portfolio fit (not just generic writing), and a one-shot "from zero to deployed site" experience that no general-purpose AI offers today.

---

## 6. User Flows and Key Scenarios

### 6.1 Flow A: First-Time User Happy Path

**Entry point:** User lands on scoutfolio.vercel.app from a tweet, a friend, or the hackathon showcase.

**Happy path:**
1. User sees hero section with three to four real-looking example portfolios animating in. CTA: "Build mine in 5 minutes."
2. User clicks CTA. Prompted to sign in with Google (NextAuth or Supabase Auth).
3. After auth, user lands in onboarding flow. Agent greets them and asks (one at a time, conversational): "What are you studying?", "What kind of role are you targeting?", "Tell me your story in a sentence or two." Free-text answers, agent reflects what it heard.
4. User selects a vibe: Minimal, Editorial, or Technical (with visual previews).
5. User reaches source connection screen. Sees buttons for GitHub, Figma, Resume Upload, Personal URL, and LinkedIn (coming soon).
6. User clicks Connect GitHub. OAuth flow. Returns to ScoutFolio with GitHub connected.
7. User uploads resume PDF. Optionally connects Figma. Optionally pastes personal URLs.
8. User clicks "Run discovery." Agent begins working.
9. Live status panel shows agent's progress: "Reading your resume...", "Pulling 47 GitHub repos...", "Analyzing portfolio fit for PM-track applications...", "Drafting copy for Project: TaskFlow..."
10. After ~60-90 seconds, agent presents the inventory: 8-15 items ranked by fit, each with title, description, source, strength score (1-10), reasoning, and a Feature/Include/Skip toggle.
11. User edits a few descriptions, marks two items as Skip, marks three as Feature.
12. User clicks "Generate site." Live preview appears in app, themed per the vibe they chose, populated with their featured and included work.
13. User can edit any text inline. Layout adapts to content volume.
14. User clicks "Export." Two options: "Download as Next.js project" (zip) or "Deploy to my Vercel" (Vercel OAuth). Both produce a working portfolio site.

**Exit point:** User has a deployable portfolio. They share the export or the live URL.

### 6.2 Flow B: Returning User

**Entry point:** User signs in.

**Happy path:**
1. Lands on dashboard showing previous inventory, current vibe, and live preview.
2. Can re-run discovery (e.g., new project added to GitHub).
3. Can swap vibe and regenerate.
4. Can re-export.

### 6.3 Flow C: Edge Cases and Error States

**User has empty/sparse GitHub:** Agent surfaces this in inventory ("Limited GitHub history detected") and weighs resume content more heavily. Inventory still produced.

**User uploads a non-resume PDF:** Agent attempts to parse, falls back to "We couldn't read this clearly. Try a text-based PDF or paste your content directly." Provides text-paste fallback.

**OAuth fails:** Standard error messaging, retry button, fallback to URL-paste flow for that source.

**Agent fails mid-discovery (API timeout, rate limit):** Partial inventory shown with note: "We hit a snag pulling from [source]. Want to retry just that source?" User can resume.

**User has no work to surface:** Inventory shows a message: "We didn't find enough to build a strong portfolio yet. Here's what we'd suggest you build to fill the gap." Agent generates 2-3 specific project ideas tailored to their target role. (Stretch P1 feature, but design for it now.)

**User's connected source has 200+ items:** Agent ranks aggressively and surfaces the top 20. UI says "We found 200+ items and ranked the strongest. View all" with a way to expand.

**Rate limit hit on AI provider:** Show clear message ("Demand is high right now, try again in a few minutes") and queue if possible.

### 6.4 Flow D: Demo Mode (Hackathon Critical)

**Entry point:** From hero, a "See a demo without signing up" link.

**Happy path:**
1. User clicks demo link.
2. Lands on a pre-populated example: a fake but realistic student persona with pre-loaded inventory and generated portfolio.
3. Can interact with the inventory review and portfolio preview without auth.
4. Cannot export, prompted to sign up to "make this yours."

**Why this matters:** Judges and casual visitors can experience the wow without going through OAuth. This is critical for hackathon evaluation.

---

## 7. Feature Requirements

### P0 — Must Have (MVP for May 4 submission)

#### 7.1 Landing Page with Trust-Building Hero
- **Description:** Marketing page with hero section, animated portfolio examples, value prop, and CTA.
- **User benefit:** Establishes credibility and defeats AI-slop suspicion in first 5 seconds.
- **Acceptance criteria:**
  - At least 3 visually distinct example portfolios animate in or scroll-reveal on hero
  - Hero loads in under 2 seconds on desktop
  - Clear primary CTA above the fold
  - Mobile responsive
  - Includes a "See a demo" secondary CTA that bypasses auth
- **Dependencies:** None.

#### 7.2 Authentication
- **Description:** Google OAuth sign-in. Persistent user accounts.
- **User benefit:** Users can return, edit, re-export.
- **Acceptance criteria:**
  - Google sign-in works
  - User session persists across browser sessions
  - Sign-out works
  - User data scoped to user ID in database
- **Dependencies:** Auth provider (NextAuth or Supabase Auth).

#### 7.3 Conversational Onboarding Flow
- **Description:** Multi-step flow that asks user about their background, target role, story, and vibe preference. Feels conversational, not form-like.
- **User benefit:** Agent gets enough context to make good judgment calls. User feels seen.
- **Acceptance criteria:**
  - At least 4 questions asked: current studies/role, target role, brief narrative, vibe preference
  - One question per screen, smooth transitions
  - Agent reflects user's answers back ("Got it, you're an engineering student aiming at PM roles")
  - Vibe preference shows visual previews of templates
  - Onboarding answers persisted to user profile
  - Skip-ahead allowed for users who want to move fast
- **Dependencies:** Auth (7.2).

#### 7.4 GitHub Source Connector (MCP)
- **Description:** One-click GitHub OAuth. Agent can pull user's repos, READMEs, languages, stars, commit activity.
- **User benefit:** Surfaces technical work without manual entry.
- **Acceptance criteria:**
  - GitHub OAuth flow works end-to-end
  - Agent retrieves at minimum: repo names, descriptions, READMEs, primary languages, star counts, last commit date, fork status
  - Forks are de-prioritized in inventory
  - Connection status visible in UI
  - Disconnect option available
- **Dependencies:** GitHub MCP server (open-source MCP available) OR direct GitHub API integration if MCP integration is too brittle for hackathon timeline.
- **Implementation note:** Prefer official GitHub MCP. Fall back to direct API if MCP integration costs more than 4 hours.

#### 7.5 Resume Upload and Parsing
- **Description:** User uploads PDF resume. Agent extracts structured content.
- **User benefit:** Captures work history and projects not on GitHub.
- **Acceptance criteria:**
  - Accepts PDF up to 5MB
  - Extracts text reliably from text-based PDFs
  - Handles common resume formats
  - Falls back to text paste if extraction fails
  - Parsed content visible to user for confirmation
- **Dependencies:** PDF parsing library (pdf-parse, pdfjs, or LLM-based extraction).

#### 7.6 Personal URL Connector
- **Description:** User pastes 1-3 URLs (personal site, blog, Devpost, etc.). Agent crawls and extracts relevant content.
- **User benefit:** Catches work that lives outside major platforms.
- **Acceptance criteria:**
  - Accepts up to 3 URLs
  - Validates URLs are reachable
  - Extracts text content and key metadata
  - Respects robots.txt
  - Handles failures gracefully (broken link, login wall)
- **Dependencies:** Web fetch tool, content extractor.

#### 7.7 Agent Discovery and Inventory Generation
- **Description:** Core agent loop. Reads connected sources, judges fit, writes copy, ranks output.
- **User benefit:** The whole product. This is the magic.
- **Acceptance criteria:**
  - Agent runs in under 90 seconds for a typical user (5 repos, resume, 1 URL)
  - Live progress narration visible to user during run
  - Output is an inventory with at least 6 items for users with reasonable input
  - Each inventory item includes: title, 2-3 sentence description, source attribution, strength score (1-10), reasoning for the score, suggested action (Feature/Include/Skip)
  - Inventory is persisted to user account
  - Re-run is possible without losing prior edits
  - Streaming response so user sees progress, not a spinner
- **Dependencies:** Vercel AI SDK, AI Gateway, all source connectors (7.4-7.6).
- **Implementation notes:**
  - Use AI Gateway for model routing
  - Recommended primary model: Claude Sonnet 4.6 or GPT-5 (whichever AI Gateway routes most reliably)
  - Use streaming for the narration UX
  - Implement per-user rate limit (e.g., 5 discoveries per day for free users) to control hackathon costs

#### 7.8 Inventory Review UI
- **Description:** Interactive screen for reviewing, editing, and triaging the agent's inventory.
- **User benefit:** Keeps the human in the loop. User trusts the output because they can edit it.
- **Acceptance criteria:**
  - All inventory items displayed in a scannable layout (cards or a curator's table, not a dense spreadsheet)
  - Each item editable inline (title, description)
  - Feature/Include/Skip toggle per item
  - Strength score and agent reasoning visible (collapsible)
  - User can re-order featured items via drag and drop or up/down controls
  - Save state persists
  - "Regenerate this item's copy" button per item (calls agent for one-off regeneration)
- **Dependencies:** 7.7.

#### 7.9 Portfolio Site Generation (Live Preview)
- **Description:** Agent generates a populated, themed portfolio site rendered as a live React preview inside the app.
- **User benefit:** Instant gratification. User sees their site come to life.
- **Acceptance criteria:**
  - Three vibes available: Minimal, Editorial, Technical
  - Default vibe selected by agent based on user's target role; user can override
  - Featured items appear prominently, Included items appear secondarily, Skipped items omitted
  - User's name, narrative, and contact info populate hero section of generated site
  - Layout adapts to content volume (no awkward empty space, no overflow)
  - Site is fully responsive (mobile + desktop)
  - All copy editable inline within the preview
- **Dependencies:** 7.8.
- **Implementation notes:**
  - Use the Anthropic frontend-design skill principles: real visual hierarchy, intentional typography, no generic AI aesthetic
  - Build templates as React components with clean prop interfaces so the generated portfolio is just a populated component
  - Consider using the v0 model to generate template variations during build

#### 7.10 Export as Code
- **Description:** User downloads their generated portfolio as a working Next.js project zip.
- **User benefit:** They own their portfolio. They can host it anywhere.
- **Acceptance criteria:**
  - Export produces a valid Next.js project that runs with `npm install && npm run dev`
  - Includes README with deployment instructions
  - Includes all images and assets referenced
  - File size under 50MB
  - Download triggered in under 10 seconds
- **Dependencies:** 7.9.

#### 7.11 Demo Mode (No Auth)
- **Description:** Pre-populated example student that visitors can interact with without signing up.
- **User benefit:** Lowers the barrier for judges and casual visitors to see the magic.
- **Acceptance criteria:**
  - Accessible from hero CTA
  - Shows pre-built inventory and portfolio for a fictional student
  - Interactive (can toggle Feature/Include/Skip, can preview portfolio)
  - Cannot export or persist changes (prompted to sign up)
- **Dependencies:** 7.8, 7.9.

---

### P1 — Should Have (post-hackathon if time allows during week)

#### 7.12 Figma Source Connector (MCP)
- One-click Figma connection. Agent reads user's public Figma files and extracts project metadata, cover images, and descriptions.
- Higher value for design-track users.

#### 7.13 Deploy to Vercel via OAuth
- User clicks "Deploy" instead of "Download." App pushes the generated portfolio to user's own Vercel account via Vercel API.
- High wow factor but operationally complex.

#### 7.14 Agent-Suggested Project Ideas
- For users with sparse inventory, agent proposes 2-3 specific projects to build, scoped to their target role.
- Turns "you don't have enough" into "here's what to do next."

#### 7.15 Multiple Templates within Each Vibe
- Each vibe (Minimal, Editorial, Technical) has 2-3 layout variants the user can swap between without re-running discovery.

---

### P2 — Nice to Have (Future)

#### 7.16 LinkedIn Connector via Proxycurl
- Real LinkedIn data ingestion. Removes the "coming soon" placeholder.

#### 7.17 Custom Domain Support
- User can map their portfolio to their own domain.

#### 7.18 Custom MCP Server: ScoutFolio Aggregator
- Single MCP server that aggregates GitHub, Figma, LinkedIn, Behance, etc. behind one interface. Submit to MCP registry.

#### 7.19 Analytics on Generated Portfolios
- Page views, source tracking, visitor demographics for users who deploy.

#### 7.20 Resume-from-Portfolio
- Inverse flow: generate a polished resume from the curated portfolio inventory.

---

## 8. Technical Requirements and Constraints

### 8.1 Tech Stack
- **Framework:** Next.js 15 (App Router), TypeScript
- **UI:** Tailwind CSS, shadcn/ui components
- **Generation:** v0 (for scaffolding components and template variations during build)
- **AI:** Vercel AI SDK + AI Gateway, primary model Claude Sonnet 4.6 or GPT-5
- **Auth:** NextAuth or Supabase Auth (Supabase preferred if also using their DB)
- **Database:** Supabase Postgres OR Vercel Postgres
- **File storage:** Supabase Storage or Vercel Blob
- **Hosting:** Vercel
- **MCPs:** GitHub MCP server, web fetch MCP, others as needed

### 8.2 Performance Requirements
- Hero TTI under 2 seconds desktop, under 4 seconds mobile
- Onboarding step transitions under 200ms
- Agent discovery total runtime under 90 seconds for typical input
- Portfolio preview render under 2 seconds after generation completes
- Export (zip download) ready in under 10 seconds

### 8.3 Security and Privacy
- All OAuth tokens encrypted at rest
- User data scoped per user ID with row-level security
- No exposed API keys client-side
- All AI calls go through server-side routes
- Privacy policy and terms drafted (template acceptable for hackathon)

### 8.4 Rate Limiting and Cost Control
- Per-user discovery limit: 5 runs per 24h for hackathon period
- Per-user copy regeneration limit: 20 calls per 24h
- Demo mode is read-only (no AI calls)
- Vercel AI Gateway used to track and cap spend

### 8.5 Data Model (High Level)

```
User
  id, email, name, created_at
  onboarding_data: { current_role, target_role, narrative, vibe_preference }

Source
  id, user_id, type (github|resume|figma|url), connection_status, last_synced_at, raw_data (jsonb)

InventoryItem
  id, user_id, title, description, source_id, source_url, strength_score, agent_reasoning, action (feature|include|skip), display_order, user_edited (bool)

PortfolioConfig
  id, user_id, vibe, hero_text, contact_info, last_generated_at

Export
  id, user_id, type (download|deploy), created_at, download_url (nullable)
```

### 8.6 Authentication and Authorization
- Google OAuth for primary user auth
- GitHub OAuth, Figma OAuth scoped per source connection
- All source tokens stored server-side, never exposed to client
- Vercel deployment OAuth (P1 feature)

---

## 9. Design and UX Guidelines

### 9.1 Visual Style Direction
- **Aesthetic:** Clean, confident, editorial. Lean toward "Linear meets Vercel meets a really good design portfolio." Avoid: dashboards that look generic, gradients used as decoration, stock illustrations.
- **Trust signals:** Real-looking example portfolios on the hero. Crisp typography. Tight spacing. Considered animations (not stock).
- **Color:** One strong brand color, otherwise mostly neutral. Black, white, off-white, single accent.
- **Typography:** A serif or display face for headlines, geometric or neutral sans for body. Inter is fine for body.

### 9.2 Responsive Requirements
- Full desktop experience
- Functional mobile experience for landing, onboarding, and inventory review
- Live portfolio preview must be responsive (the user's exported site must work on mobile)

### 9.3 Accessibility
- WCAG 2.1 AA target where feasible for hackathon
- Keyboard navigation for all primary flows
- Sufficient color contrast
- Alt text on all generated portfolio images

### 9.4 Component Library and Patterns
- shadcn/ui as the base
- Custom components for: Inventory Item Card, Source Connector Button, Vibe Picker, Live Preview Pane
- Use Anthropic's frontend-design skill principles to guide visual decisions

### 9.5 Empty States and Edge Cases
- Onboarding: no empty state needed
- Source connection: "Add your first source" CTA when none connected
- Inventory before discovery: skeleton loaders during agent run, narration visible
- Inventory empty (sparse user): supportive copy plus suggested project ideas (P1) or suggested next steps (P0)
- Portfolio preview: never blank; always show at least the hero with user's name

### 9.6 Loading States
- Discovery: animated narration of agent steps, NOT a generic spinner
- Source connections: per-source spinner with status text
- Generation: live-preview skeleton that fills in as content streams

---

## 10. Success Metrics

### 10.1 Hackathon Submission Metrics (Primary)
- App deployed and accessible at a stable URL by May 4
- Demo mode functional without auth
- At least one full happy path (sign up, connect GitHub, run discovery, review inventory, preview portfolio, export) works end-to-end
- Submission writeup completed
- At least 3 real users (friends, classmates) successfully complete the flow before submission

### 10.2 Product Metrics (Post-Hackathon)
- **Activation rate:** % of signed-up users who complete discovery (target: 70%+)
- **Completion rate:** % of users who reach export (target: 50%+)
- **Quality signal:** % of inventory items kept as-is vs. edited (target: 60%+ kept means agent copy is good)
- **Re-engagement:** % of users who return within 7 days (target: 25%+)
- **Word of mouth:** referral signups within 14 days

### 10.3 Hackathon Judging Signals
- Wow factor on first interaction (hero + demo mode are responsible for this)
- Genuinely agentic behavior visible in the UX (not just an LLM call wrapped in a form)
- Use of MCP integration is real and obvious
- Built with v0 (judges check this)
- Deployed on Vercel (judges check this)

---

## 11. Build Priority and Agent Instructions

This section is the directive for AI coding agents (Claude Code, v0, Cursor) building ScoutFolio.

### 11.1 Critical Path (Build in This Order)

**Day 1-2: Foundation and Hero**
1. Scaffold Next.js 15 project with App Router, TypeScript, Tailwind, shadcn/ui
2. Set up Supabase (auth + DB) or NextAuth + Vercel Postgres
3. Build the landing page hero with at least 3 visual portfolio examples
4. Set up Vercel deployment, get a live URL

**Day 3-4: Onboarding and Auth**
5. Implement Google OAuth
6. Build conversational onboarding flow (4 questions, vibe picker, persistence)
7. Build dashboard shell that user lands on post-onboarding

**Day 4-5: Source Connectors**
8. GitHub OAuth + repo fetching (via GitHub MCP if integration is clean, otherwise direct API)
9. Resume PDF upload + parsing
10. Personal URL connector with web fetch
11. LinkedIn placeholder button (non-functional, "coming soon" modal)

**Day 5-6: Agent and Inventory**
12. Vercel AI SDK setup with AI Gateway
13. Agent discovery prompt and orchestration (read sources, generate inventory)
14. Streaming narration UX during discovery
15. Inventory review UI with edit, toggle, reorder

**Day 6-7: Portfolio Generation and Export**
16. Three template components (Minimal, Editorial, Technical) as React components
17. Live preview generator that populates template with inventory
18. Export-as-zip endpoint that bundles the generated site as a Next.js project
19. Demo mode with pre-populated fixtures

**Day 7: Polish and Submit**
20. Hero animations and polish
21. Mobile responsive pass
22. Bug fixes from real-user testing
23. Submission writeup
24. Submit by May 4

### 11.2 Agent Behavior Conventions

- Use Vercel AI SDK exclusively for model calls. Do not call provider APIs directly.
- All AI calls server-side. Use Server Actions or API routes.
- Stream all user-facing AI output. Never block on full completion before showing anything.
- Use structured output (JSON schema or Zod) for inventory generation. Free text only for narration.
- Cache source data in DB. Never re-fetch on every page load.
- Implement per-user rate limits in middleware.

### 11.3 Code Conventions

- App Router only. No pages directory.
- Server Components by default. Client Components only where interactivity demands.
- Tailwind utility classes. No CSS modules.
- shadcn/ui for primitive components. Custom components for ScoutFolio-specific UI.
- Database access via Supabase client (or Drizzle if Vercel Postgres path).
- Type everything. No `any`.
- Co-locate components with their routes when route-specific. Shared components in `/components`.

### 11.4 What Not to Build (Scope Discipline)

- Do not build payment or subscription flow
- Do not build admin dashboard
- Do not build email notifications
- Do not build SEO infrastructure beyond basics
- Do not build internationalization
- Do not build a custom MCP server (P2)
- Do not build LinkedIn integration (P2)
- Do not build the agent-suggested-projects feature (P1, only if time)

---

## 12. Release Plan

### 12.1 Hackathon MVP (May 4, 2026)
- All P0 features functional
- Demo mode working
- Live URL submitted
- Submission writeup, video, and any required hackathon assets

### 12.2 Post-Hackathon Phase 1 (May 5-19, 2026)
- Add Figma connector
- Add Deploy-to-Vercel feature
- Add agent-suggested project ideas
- Iterate based on hackathon feedback
- Open source the code or release a public Show HN

### 12.3 Phase 2 (Beyond)
- LinkedIn integration via Proxycurl
- Custom domain support
- Multiple template variants per vibe
- Custom MCP server submission to MCP registry

### 12.4 Go-To-Market Considerations
- Launch on Product Hunt the week after hackathon
- Targeted distribution: r/cscareerquestions, r/csMajors, r/PMcareers, university Discord servers
- Twitter/X thread with the demo video
- Direct outreach to university career services

---

## 13. Open Questions and Assumptions

### 13.1 Open Questions

| Question | Owner | Resolution Needed By |
|---|---|---|
| Final auth choice: NextAuth vs Supabase Auth? Picking Supabase for combined auth+DB simplicity unless objection. | Aaron | Day 1 of build |
| AI Gateway model choice: Claude Sonnet 4.6 or GPT-5 as primary? | Aaron | Day 5 of build |
| Demo mode persona: pick a real-feeling fictional student. Recommend "Maya, junior design student pivoting to UX research" or "Jordan, CS junior aiming at product engineering." | Aaron | Day 6 of build |
| Branding: keep "ScoutFolio" name or iterate? | Aaron | Day 1 of build |
| Free tier limits post-hackathon: how many discoveries per month for free users? | Aaron | Post-hackathon |

### 13.2 Assumptions

- Vercel AI SDK + AI Gateway is the right primary choice (aligned with hackathon track)
- GitHub MCP server is functional enough to use during hackathon week (validate Day 4)
- Resume PDF parsing is reliable enough with off-the-shelf libraries (validate Day 4)
- Three template vibes is enough variety for v1 (validate during user testing)
- Users are willing to grant GitHub OAuth (validate during user testing)
- Supabase free tier handles hackathon-period traffic
- Vercel free tier handles hackathon-period traffic
- AI Gateway costs stay under hackathon budget with rate limits in place

---

## 14. Appendices

### 14.1 Related Documents
- This PRD: `SCOUTFOLIO_PRD.md`
- Future: `CLAUDE.md` for Claude Code context
- Future: `AGENTS.md` for general agent context

### 14.2 Hackathon Submission Checklist
- [ ] Live deployed URL on Vercel
- [ ] Built with v0 (visible in commit history or noted in submission)
- [ ] At least one MCP integration functional and demonstrable
- [ ] Demo video (60-180 seconds)
- [ ] Submission writeup
- [ ] GitHub repo public (or accessible to judges)
- [ ] Track designation: v0 + MCPs

### 14.3 Reference Patterns
- For agent narration UX: see Perplexity's search reasoning UI, Cursor's agent panel, Claude Artifacts streaming
- For onboarding: see Linear's onboarding, Notion's setup flow
- For hero design: see Vercel's product pages, Linear, Resend
- For portfolio template inspiration: see Awwwards student portfolio winners

### 14.4 Anti-Patterns to Avoid
- Generic AI dashboard aesthetic (sidebar + main + chat panel, all neutral grays)
- Loading spinners with no narration during long agent runs
- Forms that ask 15 questions before showing value
- Portfolio templates that look like Squarespace defaults
- "AI-generated" disclaimers visible on the user's exported portfolio (it's their work, not the AI's)

---

**End of v1.0 PRD**
