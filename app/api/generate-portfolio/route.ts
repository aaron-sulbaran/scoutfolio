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
  validateContent,
} from "@/lib/portfolio-scaffold/schema";

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

  const featured = parsed.inventory.items.filter(
    (i) => i.suggestedAction !== "skip"
  );

  const inventoryContext = featured
    .map(
      (i, idx) =>
        `${idx + 1}. [${i.suggestedAction.toUpperCase()}] ${i.title}\n   ${i.description}\n   Source: ${i.source}. Strength: ${i.strengthScore}/10.`
    )
    .join("\n\n");

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
          text: "Reading your reviewed inventory.",
        });
        send(controller, {
          type: "status",
          text: "Composing your hero, work ledger, about, and contact.",
        });

        const result = await generateObject({
          model: anthropic(MODEL),
          schema: ContentWithMetaSchema,
          system: `You are ScoutFolio's portfolio generation agent. You write the CONTENT of a personal portfolio: name, taglines, project copy, about prose, and a closing line. You do NOT write code, HTML, CSS, or markup of any kind. You never use em dashes (use commas, semicolons, or separate sentences). You never invent URLs or facts the candidate did not provide. Lead with verbs and outcomes. Avoid filler ("passionate about", "team player", "results-driven"). Match the editorial-monograph tone: confident, specific, slightly literary, but plainspoken. Italic emphasis (taglineEmphasis) should land on noun phrases that earn the weight, not adjectives.`,
          prompt: `Compose the portfolio content for this candidate.

Name: ${candidateName}
Target role: ${targetRole}
Headline (from discovery): ${parsed.inventory.headline}
Narrative (free text the candidate wrote about themselves):
${narrative || "(none provided)"}

Contact links (pass these through verbatim into contact fields when present):
${
  Object.entries(contact)
    .filter(([, v]) => Boolean(v))
    .map(([k, v]) => `- ${k}: ${v}`)
    .join("\n") || "(none provided)"
}

Reviewed inventory (FEATURE = top of work ledger, INCLUDE = secondary slot, items where action is skip have been filtered out already):

${inventoryContext}

Output the structured content object. Featured projects come first in the projects array. Use the candidate's exact name. Do not invent links, metrics, or employers.`,
        });

        const { meta, ...rest } = result.object;
        const content: PortfolioContent = rest;

        send(controller, {
          type: "status",
          text: "Validating generated content.",
        });

        const err = validateContent(content);
        if (err) {
          send(controller, { type: "error", message: err });
          controller.close();
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
