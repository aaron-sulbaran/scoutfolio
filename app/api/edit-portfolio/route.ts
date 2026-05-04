// Portfolio editing: takes the user's CURRENT PortfolioContent plus a natural
// language instruction, asks the agent to apply only the requested changes,
// validates the result, and returns a fresh assembled bundle (files +
// previewHtml). Mirrors /api/generate-portfolio's NDJSON streaming shape so the
// client can reuse the same reader.

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
  ContentSchema,
  validateContent,
  type ValidatablePortfolioContent,
} from "@/lib/portfolio-scaffold/schema";
import { sanitizeCustomCss } from "@/lib/portfolio-scaffold/css-sanitizer";
import { describeLayoutVocabulary } from "@/lib/portfolio-scaffold/templates";

export const runtime = "nodejs";
export const maxDuration = 90;

const MODEL = "claude-sonnet-4-6";

const RequestSchema = z.object({
  message: z.string().min(1).max(500),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        text: z.string(),
      })
    )
    .max(20)
    .optional(),
  meta: z.object({
    slug: z.string().min(1).max(80),
    title: z.string().min(1).max(120),
  }),
  currentContent: ContentSchema,
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return new Response("Unauthorized", { status: 401 });
  }

  const limit = await preflightLimit("edit", session.user.email);
  if (!limit.ok) {
    return rateLimitedResponse(
      limit,
      rateLimitMessage("edit", limit.resetMs)
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

  const { currentContent, message, history, meta } = parsed;

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
          text: "Reading your request.",
        });

        const historyContext = history && history.length > 0
          ? `\nRecent conversation (oldest first):\n${history
              .map(
                (h) =>
                  `- ${h.role === "user" ? "User" : "You"}: ${h.text}`
              )
              .join("\n")}\n`
          : "";

        const result = await generateObject({
          model: anthropic(MODEL),
          schema: ContentSchema,
          system: `You are ScoutFolio's portfolio EDITING agent. The user has an existing portfolio content object (including a theme with composable layout) and is asking for a specific change. Apply ONLY that change. Preserve every other field of the content object exactly as it was.

Strict rules:
- Output the FULL updated content object (every field, including the theme object with its layout sub-fields). Fields the user did not ask to change must be byte-for-byte identical to the input.
- Never invent new projects, links, employers, metrics, or facts the user did not provide.
- Never use em dashes (use commas, semicolons, or separate sentences).
- taglineEmphasis phrases must appear verbatim in tagline.
- If the user asks for something ambiguous, make the smallest reasonable interpretation and apply it.

Theme editing is ALLOWED:
- "Make it darker" / "dark mode" -> set theme.mode to 'dark', shift colors to a near-black paper, cream ink, brighter rust.
- "Make it lighter" -> mirror the inverse.
- "Use [color] as the accent" -> update theme.colors.rust to a hex matching the requested hue.
- "Cooler / warmer / more saturated palette" -> shift all six color tokens coherently while keeping mode and the accent's role intact.
- "Use a [font]" -> pick the closest enum value from the registered fonts. All color values must be 6-digit hex codes ('#RRGGBB').

Layout switching is ALSO ALLOWED. theme.layout is composable: { hero, work, about, contact }. The user may ask to change one or more sections.

${describeLayoutVocabulary()}

If the user says "switch to a terminal/dev style", set hero "terminal-prompt", work "git-log", about "code-block", contact "code-block" (and probably mode "dark"). If they say "make it minimal", set hero "minimal-stack", work "list-stack", about "single-block", contact "inline-middots". If they say "asymmetric / creative / visual", set hero "asymmetric-display", work "gallery-asymmetric", about "pull-quote", contact "footer-band". If they only mention one section ("make the hero a terminal style"), only change that one slot. If the user does not mention layout, preserve every theme.layout slot byte-for-byte.

Custom CSS escape hatch:
- The user may ask for stylistic details the structured fields cannot express (texture, letter-spacing, decorative treatments). Update theme.customCss to honor it within the whitelist (max ~1500 chars).
- Allowed selectors: .scout-* class hooks, :root for CSS variables, a/body/html with limited properties. Allowed at-rules: @media size queries.
- Do NOT use @import, @font-face, * selectors, attribute selectors, or url() pointing anywhere except data: URIs.
- If the user does NOT mention adding/changing custom CSS, preserve theme.customCss byte-for-byte.`,
          prompt: `Current portfolio content (JSON):
${JSON.stringify(currentContent, null, 2)}
${historyContext}
User's edit request: ${message}

Return the FULL updated content object with the user's requested change applied. Every other field must remain identical to the input.`,
        });

        const updated = result.object as ValidatablePortfolioContent;

        // Sanitize the customCss if the agent emitted any. Same string is
        // injected into the preview iframe AND the exported globals.css, so
        // sanitization keeps both safe in lockstep.
        if (updated.theme.customCss) {
          const { css, dropped } = sanitizeCustomCss(updated.theme.customCss);
          updated.theme.customCss = css || undefined;
          if (dropped.length > 0) {
            console.log(
              "[edit-portfolio] sanitized customCss, dropped:",
              dropped
            );
          }
        }

        send(controller, {
          type: "status",
          text: "Validating the edit.",
        });

        const err = validateContent(updated);
        if (err) {
          send(controller, { type: "error", message: err });
          return;
        }

        // No-op detection: if the updated content equals the current content
        // (e.g. the user asked for a styling change we don't support), surface
        // the friendly notice and DO NOT consume a rate-limit slot.
        const currentJson = JSON.stringify(currentContent);
        const updatedJson = JSON.stringify(updated);
        if (currentJson === updatedJson) {
          send(controller, {
            type: "no_op",
            message:
              "I can change text, projects, palette, fonts, and light/dark mode, but the layout (numbered sections, drop caps, hairline grid) is fixed for this version. Try a content or theme tweak instead.",
          });
          return;
        }

        send(controller, {
          type: "status",
          text: "Reassembling your portfolio.",
        });

        const composed = composePortfolio({
          projectName: meta.slug,
          title: meta.title,
          content: updated as PortfolioContent,
        });

        await recordUsage("edit", session.user!.email!);

        const summary = describeChange(currentContent, updated);

        send(controller, {
          type: "complete",
          data: {
            files: composed.files,
            previewHtml: composed.previewHtml,
            content: updated,
            summary,
            meta: {
              name: meta.slug,
              title: meta.title,
            },
          },
        });
      } catch (err) {
        console.error("[edit-portfolio] error:", err);
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

// Lightweight diff summary for the chat panel. Lists the top-level fields
// that changed so the user has feedback even when they can't see the field
// they asked about. Bounded length, not a full diff.
function describeChange(
  before: ValidatablePortfolioContent,
  after: ValidatablePortfolioContent
): string {
  const changes: string[] = [];
  if (before.name !== after.name) changes.push("name");
  if (before.primaryRole !== after.primaryRole) changes.push("role");
  if (before.location !== after.location) changes.push("location");
  if (
    before.tagline !== after.tagline ||
    before.taglineEmphasis.join("|") !== after.taglineEmphasis.join("|")
  )
    changes.push("tagline");
  if (before.intro !== after.intro) changes.push("intro");
  if (JSON.stringify(before.projects) !== JSON.stringify(after.projects)) {
    if (before.projects.length !== after.projects.length) {
      changes.push(
        `projects (${before.projects.length} → ${after.projects.length})`
      );
    } else {
      changes.push("projects");
    }
  }
  if (JSON.stringify(before.about) !== JSON.stringify(after.about))
    changes.push("about");
  if (JSON.stringify(before.contact) !== JSON.stringify(after.contact))
    changes.push("contact");
  if (JSON.stringify(before.theme) !== JSON.stringify(after.theme)) {
    const layoutChanges: string[] = [];
    if (before.theme.layout.hero !== after.theme.layout.hero)
      layoutChanges.push(`hero -> ${after.theme.layout.hero}`);
    if (before.theme.layout.work !== after.theme.layout.work)
      layoutChanges.push(`work -> ${after.theme.layout.work}`);
    if (before.theme.layout.about !== after.theme.layout.about)
      layoutChanges.push(`about -> ${after.theme.layout.about}`);
    if (before.theme.layout.contact !== after.theme.layout.contact)
      layoutChanges.push(`contact -> ${after.theme.layout.contact}`);
    if (layoutChanges.length > 0) {
      changes.push(`layout (${layoutChanges.join(", ")})`);
    }
    if (before.theme.mode !== after.theme.mode) {
      changes.push(`theme (${after.theme.mode} mode)`);
    } else if (layoutChanges.length === 0) {
      changes.push("theme");
    }
  }

  if (changes.length === 0) return "Applied your edit.";
  if (changes.length === 1) return `Updated ${changes[0]}.`;
  return `Updated ${changes.slice(0, -1).join(", ")} and ${changes[changes.length - 1]}.`;
}
