# ScoutFolio — 2-Hour Demo PRD

**Version:** 0.1 (Live Event Build)  
**Last Updated:** April 26, 2026  
**Status:** Active Build  
**Owner:** Aaron  
**Context:** Vercel "Zero to Agent" hackathon, live launch event demo  
**Time Budget:** 2 hours, hard stop  
**Parent Document:** `SCOUTFOLIO_PRD.md` (v1.0, full hackathon spec for May 4 deadline)

---

## Changelog

| Version | Date         | Changes                                                          |
|---------|--------------|------------------------------------------------------------------|
| 0.1     | Apr 26, 2026 | Initial scope. Landing + Auth + Connectors UI shell only.        |

---

## 1. What This Document Is

This is a deliberately stripped-down PRD for a 2-hour build during the live launch event of the Zero to Agent hackathon. The full product spec lives in `SCOUTFOLIO_PRD.md` and remains the source of truth for the May 4 deadline. This document only governs what gets built in this 2-hour window.

The goal of the live event demo is to show momentum, not completeness. By the end of the 2 hours, you should be able to walk a judge or peer through a deployed URL that:

1. Shows a polished landing page that establishes the product concept
2. Lets them sign in with Google
3. Lands them on a connectors page that shows the four data sources ScoutFolio will read from

The agent itself, the discovery flow, the inventory review, the portfolio generation, and the export are explicitly out of scope. Those are the May 4 deliverables.

---

## 2. Success Criteria for the 2-Hour Demo

You are successful if all of the following are true at the end of the window:

- A live URL on Vercel renders the landing page with the editorial aesthetic, three example portfolio cards, and clear CTAs
- Clicking "Get started" or "Sign in" initiates Google OAuth and successfully signs the user in
- After sign-in, the user lands on a `/connect` page that shows four connector cards (GitHub, Resume, Personal URL, LinkedIn-coming-soon)
- The site is mobile responsive enough that it doesn't break on a phone
- Color tokens are defined as CSS variables so the accent can be swapped in seconds
- The site does not have to actually do anything beyond rendering and authenticating

You are not successful if:

- You spent time building any backend logic for the connectors
- You spent time on the agent, the inventory, or the portfolio generation
- The site looks generic or rushed in a way that undermines the trust factor
- The auth flow is broken or untested

---

## 3. Scope: What To Build

### 3.1 Project Scaffold (v0 → Local)

- Next.js 15 App Router, TypeScript, Tailwind CSS
- shadcn/ui initialized
- Pulled from v0 into local project
- Pushed to GitHub
- Connected to Vercel with auto-deploy on main

### 3.2 Color Token System

Defined in `app/globals.css` as CSS variables and exposed via Tailwind config:

```
--background: #FAF8F5     (warm off-white)
--foreground: #1A1A1A     (near-black)
--muted: #6B5E70          (muted plum-gray)
--accent: #3D2D4F         (deep aubergine)
--accent-foreground: #FAF8F5
--border: #EAE6E0
--card: #FDFBF8
```

Tailwind config exposes these as `bg-background`, `text-foreground`, `text-muted`, `bg-accent`, `text-accent`, `bg-accent-foreground`, `border-border`, `bg-card`. No hardcoded hex values anywhere in JSX or component CSS.

### 3.3 Landing Page (`/`)

Single-page editorial landing with the following structure, top to bottom:

**Top Nav (sticky)**
- Left: "ScoutFolio" wordmark, medium weight, primary text color
- Right: "Sign in" link in muted text, plus a small primary "Get started" button in accent color

**Hero Section**
- Eyebrow text: "FOR STUDENTS WHO BUILD" (small, uppercase, letter-spaced, muted color)
- Headline: serif display, 64-80px desktop. "Your portfolio is hiding in plain sight."
- Subhead: 18-20px, muted color, max-width 580px. "ScoutFolio is an agent that finds your best work across GitHub, your resume, and the web. It writes it for recruiters and ships you a site you'd actually share."
- Primary CTA: "Build mine" button in accent color
- Secondary CTA: "See examples" text link with arrow, scrolls to examples section
- Trust line: "Free during beta. No credit card." (small, muted)

**Examples Section**
- Eyebrow: "PORTFOLIOS, GENERATED" (centered, muted)
- Three portfolio preview cards in a row on desktop, stacked on mobile:
  - **Maya Chen, UX Researcher**: clean off-white card, large serif name, three plum-toned project rectangle thumbnails below
  - **Jordan Park, Software Engineer**: terminal-ish typography, code snippet preview, decorative commit-graph element
  - **Riya Patel, Product Designer**: visual grid layout, warm-toned image placeholder rectangles, designer-y typography
- Each card has subtle border, 8px rounded corners, subtle hover lift

**Closing CTA Section**
- Centered serif headline: "Built in 5 minutes. Yours forever."
- Same primary "Build mine" CTA in accent

**Footer**
- Single line, centered, muted: "Built for Vercel's Zero to Agent Hackathon · 2026"

### 3.4 Authentication

- NextAuth v5 (beta) with Google provider
- Sign-in button in nav and "Get started" CTA both trigger Google OAuth
- After successful auth, user is redirected to `/connect`
- `/connect` route is protected and redirects unauthenticated users back to `/`
- Sign-out functionality available from the connectors page nav

### 3.5 Connectors Page (`/connect`)

This page is visual only. No backend connection logic. The Connect buttons can either do nothing or update local state to show a fake "connected" indicator.

**Top Nav**
- Same wordmark left, but right side shows "Sign out" instead of sign-in CTAs

**Page Header**
- Eyebrow: "STEP 1 OF 2" (uppercase, muted)
- Heading: serif display, ~48px. "Let's find your work."
- Subhead: 18px muted, max-width 540px. "ScoutFolio reads from the places your work already lives. Connect at least one to get started. The more you connect, the better the result."

**Connector Grid (2x2 desktop, 1 column mobile)**

Each card: subtle border, 12px rounded corners, card background slightly lighter than page bg, ~32px padding, service name primary color medium weight 18px, description muted 14px, action element on the right or bottom.

- **GitHub**: "We'll surface your strongest repos and READMEs." → "Connect" button in accent
- **Resume**: "Upload your resume PDF. We'll read it like a recruiter would." → "Upload" button with file icon
- **Personal URL**: "Blog, Devpost, personal site, anything public." → small text input + "Add" button
- **LinkedIn**: "We'll pull your experience and projects." → disabled "Coming soon" button, card at ~60% opacity

**Discovery CTA**
- Below the grid, centered
- Primary "Run discovery" button in accent, larger than connector buttons
- Visually disabled (lower opacity, not actionable) until at least one source is "connected" in local state
- Below button, muted text: "We'll analyze your sources and build your portfolio inventory in about 60 seconds."

**Footer**
- Same minimal footer as landing

### 3.6 Mobile Responsiveness

- All layouts adapt cleanly to a phone viewport
- Hero text scales down appropriately
- Example portfolio cards stack vertically on mobile
- Connector grid becomes single column
- Nav remains usable on small screens

---

## 4. Explicitly Out Of Scope

These belong to the May 4 build, not this 2-hour window:

- The conversational onboarding flow (the 4-question agent intro)
- Vibe selection during onboarding
- GitHub OAuth integration (the actual data fetching)
- Resume PDF parsing
- Personal URL crawling
- The agent itself (Vercel AI SDK, AI Gateway, prompts)
- The streaming narration UX
- Inventory generation and review UI
- Portfolio template generation
- Live preview of the generated portfolio
- Export-as-zip or deploy-to-Vercel
- Demo mode with pre-populated fixtures
- Database schema beyond what NextAuth requires for sessions
- LinkedIn connector logic
- Figma connector
- Animations beyond a subtle hover state on cards
- Analytics, error tracking, observability

If you find yourself starting any of these, stop. Move it to a TODO and return to scope.

---

## 5. Tech Stack For This Window

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui
- NextAuth v5 beta (Google provider only)
- Vercel hosting
- v0 for initial component generation
- Claude Code for project-level work after scaffold lands locally

No database for this window. NextAuth in JWT session mode requires no DB. If a database is genuinely needed for sessions, use Vercel Postgres or Supabase, but default to JWT to avoid the setup cost.

---

## 6. Build Order and Time Budget

| Phase | Time | Outcome |
|---|---|---|
| Scaffold project, push to GitHub, connect Vercel | 0:00 - 0:15 | Live URL renders default Next.js page |
| Generate landing page in v0 with prompt, pull into project | 0:15 - 0:55 | Landing page deployed and looks editorial |
| Mobile check + buffer for landing page issues | 0:55 - 1:00 | Landing page final |
| NextAuth setup with Google OAuth | 1:00 - 1:30 | Sign-in works end-to-end on live URL |
| Generate connectors page in v0, pull into project | 1:30 - 1:55 | `/connect` renders with all 4 cards |
| Final push, smoke test the full flow | 1:55 - 2:00 | Live demo ready |

If you fall behind, cut in this order:
1. Skip the closing CTA section on the landing page
2. Skip the third example portfolio card
3. Reduce hero to headline + subhead + one CTA only
4. On `/connect`, skip the Personal URL input and just show three cards

Auth and the basic structure of both pages are the spine. Everything else is dressing.

---

## 7. Demo Script

When you walk someone through this at the live event, the framing matters more than the polish. Suggested 90-second walkthrough:

> "This is ScoutFolio, an AI agent that builds personal portfolios for students by going out and finding their work for them. Most students struggle with two things: figuring out what to put on their portfolio, and writing about it in a way that lands with recruiters. ScoutFolio solves both.
>
> What I have running right now is the front of the experience. The landing page sets up the concept, you sign in with Google, and you land on a page that shows the four sources the agent will read from: GitHub, your resume, a personal URL, and LinkedIn coming soon.
>
> Over the next week I'm building the agent itself. It runs across all those sources, judges what's portfolio-worthy, writes recruiter-facing copy, and outputs a deployed personal site. Final version submits May 4 for the hackathon."

Then walk through: landing page (pause on the example portfolios), click Get Started, sign in with Google, land on `/connect`, point at the four cards. Done.

---

## 8. Open Questions and Assumptions

### 8.1 Open Questions
- None blocking. Resolve everything inline during the build.

### 8.2 Assumptions
- Google OAuth provisioning takes under 10 minutes (consoles can be slow; if it stalls, ship landing page only and show auth as the next step)
- v0 produces usable output on first or second prompt iteration
- Vercel deployment from GitHub auto-deploys without manual config
- shadcn/ui init does not introduce dependency conflicts with the v0-generated code

---

**End of v0.1 PRD**
