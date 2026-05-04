// Portfolio generation: structured CONTENT only (no agent-written TSX).
//
// The agent emits a PortfolioContent object validated against a Zod schema.
// ScoutFolio then assembles the export bundle and the preview HTML
// deterministically from that content using committed templates in
// lib/portfolio-scaffold/. Preview and export are byte-equivalent in layout
// because both are pure functions of the same content.

import { auth } from "@/auth";
import { generateObject } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import {
  preflightLimit,
  rateLimitedResponse,
  rateLimitMessage,
  recordUsage,
} from "@/lib/rate-limit";
import {
  composePortfolio,
  type PortfolioContent,
} from "@/lib/portfolio-scaffold/compose";
import {
  ContentWithMetaSchema,
  StylePreferencesSchema,
  validateContent,
} from "@/lib/portfolio-scaffold/schema";
import { sanitizeCustomCss } from "@/lib/portfolio-scaffold/css-sanitizer";
import { resolveBaselineTheme } from "@/lib/portfolio-scaffold/presets";
import { describeLayoutVocabulary } from "@/lib/portfolio-scaffold/templates";

export const runtime = "nodejs";
export const maxDuration = 90;

const MODEL = "claude-sonnet-4-6";

const InventoryItemSchema = z.object({
  title: z.string(),
  description: z.string(),
  source: z.string(),
  strengthScore: z.number(),
  reasoning: z.string(),
  suggestedAction: z.enum(["feature", "include", "skip"]),
});

const RequestSchema = z.object({
  inventory: z.object({
    headline: z.string(),
    items: z.array(InventoryItemSchema),
    suggestedNext: z.array(z.string()).optional(),
  }),
  user: z.object({
    name: z.string().optional(),
    targetRole: z.string().optional(),
    contact: z
      .object({
        email: z.string().optional(),
        github: z.string().optional(),
        linkedin: z.string().optional(),
        website: z.string().optional(),
      })
      .optional(),
  }),
  stylePreferences: StylePreferencesSchema.optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return new Response("Unauthorized", { status: 401 });
  }

  const limit = await preflightLimit("generate", session.user.email);
  if (!limit.ok) {
    return rateLimitedResponse(
      limit,
      rateLimitMessage("generate", limit.resetMs)
    );
  }

  let parsed;
  try {
    parsed = RequestSchema.parse(await req.json());
  } catch (err) {
    return new Response(
      `Invalid request: ${err instanceof Error ? err.message : String(err)}`,
      { status: 400 }
    );
  }

  const narrative = session.user.onboardingNarrative ?? "";
  const candidateName =
    parsed.user.name ??
    session.user.displayName ??
    session.user.name ??
    "Anonymous Builder";
  const targetRole = parsed.user.targetRole ?? "the role they are targeting";
  const contact = parsed.user.contact ?? {};
  const prefs = parsed.stylePreferences ?? {};
  const baselineTheme = resolveBaselineTheme(prefs);
  const overrides = prefs.layoutOverrides ?? {};

  const featured = parsed.inventory.items.filter(
    (i) => i.suggestedAction !== "skip"
  );

  const inventoryContext = featured
    .map(
      (i, idx) =>
        `${idx + 1}. [${i.suggestedAction.toUpperCase()}] ${i.title}\n   ${i.description}\n   Source: ${i.source}. Strength: ${i.strengthScore}/10.`
    )
    .join("\n\n");

  const briefSection = prefs.brief
    ? `\nUSER STYLE BRIEF (treat as the strongest signal, above narrative and role):\n"${prefs.brief}"\n`
    : "\nNo explicit style brief provided. Pick a layout, palette, fonts, and customCss that match the candidate's narrative and target role.\n";

  const overrideSection = (() => {
    const lines: string[] = [];
    if (overrides.hero) lines.push(`hero: "${overrides.hero}"`);
    if (overrides.work) lines.push(`work: "${overrides.work}"`);
    if (overrides.about) lines.push(`about: "${overrides.about}"`);
    if (overrides.contact) lines.push(`contact: "${overrides.contact}"`);
    if (lines.length === 0) return "";
    return `\nLAYOUT OVERRIDES (the user pinned these slots; you MUST use them exactly):\n${lines.join("\n")}\n`;
  })();

  const baselineHint = JSON.stringify(baselineTheme, null, 2);
  const vocabulary = describeLayoutVocabulary();

  const encoder = new TextEncoder();
  const send = (
    controller: ReadableStreamDefaultController,
    event: object
  ) => {
    controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
  };

  const stream = new ReadableStream({
    async start(controller) {
      try {
        send(controller, {
          type: "status",
          text: "Reading your reviewed inventory and style brief.",
        });
        send(controller, {
          type: "status",
          text: "Picking the layout, palette, and tone for your portfolio.",
        });

        const result = await generateObject({
          model: anthropic(MODEL),
          schema: ContentWithMetaSchema,
          system: `You are ScoutFolio's portfolio generation agent. You write the CONTENT and choose the THEME (composable layout + colors + fonts + optional customCss) for a personal portfolio. You do NOT write TSX, HTML, or markup.

Priority order for design decisions: (1) the user's style brief, if present, (2) the candidate's narrative, (3) the target role, (4) the inventory.

Component vocabulary (pick one variant per slot):

${vocabulary}

A few opinionated pairings the brief should nudge you toward:
- Developer / hacker / terminal brief -> hero "terminal-prompt", work "git-log", about "code-block", contact "code-block", mode "dark", mono-leaning fonts (jetbrains-mono / fira-code).
- Minimal / quiet / no-decoration brief -> hero "minimal-stack", work "list-stack", about "single-block", contact "inline-middots".
- Editorial / literary / monograph brief -> hero "centered-editorial", work "ledger-grid", about "drop-cap", contact "card-bordered" (the default Studio Monograph).
- Visual / creative / asymmetric brief -> hero "asymmetric-display", work "gallery-asymmetric", about "pull-quote", contact "footer-band".
You may MIX and MATCH variants if the brief calls for it (e.g. terminal hero + ledger work).

Custom CSS escape hatch:
- You may emit theme.customCss (max ~1500 chars) to honor stylistic asks the structured fields cannot express (texture, letter-spacing, font-feature-settings, decorative treatments, hover states).
- Target only these stable class hooks: .scout-page, .scout-hero, .scout-hero-name, .scout-hero-tagline, .scout-hero-intro, .scout-section, .scout-section-header, .scout-section-eyebrow, .scout-section-numeral, .scout-section-title, .scout-work-list, .scout-work-item, .scout-work-title, .scout-work-meta, .scout-work-summary, .scout-work-stack, .scout-about, .scout-about-prose, .scout-about-sidebar, .scout-contact, .scout-contact-line, .scout-contact-list, .scout-rule, .scout-emphasis. You may also target :root (CSS variables only), and a/body/html (limited properties). @media size queries are allowed.
- Do NOT use @import, @font-face, * selectors, attribute selectors, or url() pointing anywhere except data: URIs.
- Anything outside the whitelist is dropped server-side, so be conservative and intentional.

Content rules:
- Write name, taglines, project copy, about prose, and a closing line.
- Never use em dashes (use commas, semicolons, or separate sentences).
- Never invent URLs or facts the candidate did not provide.
- Lead with verbs and outcomes. Avoid filler ("passionate about", "team player", "results-driven").
- Match the tone implied by the brief and chosen layout: editorial = confident and slightly literary, developer = terse and technical, minimal = quiet and direct, creative = expressive and image-forward.
- Italic emphasis (taglineEmphasis) should land on noun phrases that earn the weight, not adjectives.

Theme rules:
- All color values must be 6-digit hex codes ('#RRGGBB').
- The baseline below is YOUR starting point. Adjust any field the user's brief contradicts (e.g. brief says "forest green accent" -> shift theme.colors.rust to a deep green hex).
- In dark mode, paper should be near-black, ink should be cream or near-white, and rust should brighten so accents stay legible.
- Fonts must be picked from the registered enum lists; pick the ones that best serve the brief.

Baseline theme to start from:
${baselineHint}
${overrideSection}`,
          prompt: `Compose the portfolio content and theme for this candidate.

Name: ${candidateName}
Target role: ${targetRole}
Headline (from discovery): ${parsed.inventory.headline}
Narrative (free text the candidate wrote about themselves):
${narrative || "(none provided)"}
${briefSection}
Contact links (pass these through verbatim into contact fields when present):
${
  Object.entries(contact)
    .filter(([, v]) => Boolean(v))
    .map(([k, v]) => `- ${k}: ${v}`)
    .join("\n") || "(none provided)"
}

Reviewed inventory (FEATURE = top of work ledger, INCLUDE = secondary slot, items where action is skip have been filtered out already):

${inventoryContext}

Output the structured content object including a complete theme (mode, colors, fonts, layout, optional customCss). Featured projects come first in the projects array. Use the candidate's exact name. Do not invent links, metrics, or employers.`,
        });

        const { meta, ...rest } = result.object;
        const content: PortfolioContent = rest as PortfolioContent;

        // Apply overrides: even if the agent didn't honor a pinned slot, force
        // it back to the user's choice.
        if (overrides.hero) content.theme.layout.hero = overrides.hero;
        if (overrides.work) content.theme.layout.work = overrides.work;
        if (overrides.about) content.theme.layout.about = overrides.about;
        if (overrides.contact) content.theme.layout.contact = overrides.contact;

        // Sanitize the customCss if present.
        if (content.theme.customCss) {
          const { css, dropped } = sanitizeCustomCss(content.theme.customCss);
          content.theme.customCss = css || undefined;
          if (dropped.length > 0) {
            console.log(
              "[generate-portfolio] sanitized customCss, dropped:",
              dropped
            );
          }
        }

        send(controller, {
          type: "status",
          text: "Validating generated content.",
        });

        const err = validateContent(content);
        if (err) {
          send(controller, { type: "error", message: err });
          return;
        }

        const slug =
          meta.slug
            .toLowerCase()
            .replace(/[^a-z0-9-]/g, "-")
            .replace(/-+/g, "-")
            .replace(/^-|-$/g, "")
            .slice(0, 60) || "portfolio";

        send(controller, {
          type: "status",
          text: "Assembling your portfolio bundle.",
        });

        const composed = composePortfolio({
          projectName: slug,
          title: meta.title,
          content,
        });

        for (const f of composed.files) {
          send(controller, { type: "file_complete", path: f.path });
        }

        await recordUsage("generate", session.user!.email!);

        const summary = `Drafted hero, ${content.projects.length} project${content.projects.length === 1 ? "" : "s"}, about, and contact. Edit anything by chatting on the left.`;

        send(controller, {
          type: "complete",
          data: {
            files: composed.files,
            previewHtml: composed.previewHtml,
            content,
            summary,
            meta: {
              name: slug,
              title: meta.title,
            },
          },
        });
      } catch (err) {
        console.error("[generate-portfolio] error:", err);
        send(controller, {
          type: "error",
          message: err instanceof Error ? err.message : String(err),
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      ...limit.headers,
      "content-type": "application/x-ndjson; charset=utf-8",
      "cache-control": "no-store",
      "x-accel-buffering": "no",
    },
  });
}
