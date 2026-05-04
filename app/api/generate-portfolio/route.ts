// Portfolio generation: structured output via Anthropic Sonnet 4.6.
// We stream NDJSON status events for the live narration, then run a single
// generateObject call. The model returns:
//   - five TSX file contents (hero, projects, about, contact, page) for export
//   - a self-contained previewHtml string for the iframe preview
//   - a meta object (project name, title)
//
// We do NOT transpile TSX server-side. The previewHtml is generated alongside
// the TSX so the preview iframe can render without an in-browser bundler.
// If Sonnet 4.6 hits its 10k tpm ceiling, swap MODEL to claude-haiku-4-5.

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
import { buildScaffold, type ScaffoldFile } from "@/lib/portfolio-scaffold/files";

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

const OutputSchema = z.object({
  hero: z
    .string()
    .describe(
      "Full TypeScript source for app/components/hero.tsx. A Server Component (no 'use client'). Default-exports a Hero function. Imports only from 'react'. Renders the candidate's name in a serif heading with one italic emphasized word, a one-line headline, a short narrative line, and a primary CTA link to #contact. Use Tailwind classes only from this allowlist: bg-background, bg-card, text-foreground, text-muted, bg-accent, text-accent-foreground, border-border, font-serif, font-sans, italic. Use semantic spacing (px-6, py-24, max-w-4xl, mx-auto). No em dashes anywhere."
    ),
  projects: z
    .string()
    .describe(
      "Full TypeScript source for app/components/projects.tsx. A Server Component. Default-exports a Projects function. Renders inventory items where action is 'feature' or 'include' as a list of project cards. Each card has a serif title, a 2 to 3 sentence description, the source label in muted small-caps, and a link if one is in the description. Featured items get a more prominent treatment (border-accent, shadow). Use only allowlisted Tailwind classes. No em dashes."
    ),
  about: z
    .string()
    .describe(
      "Full TypeScript source for app/components/about.tsx. A Server Component. Default-exports an About function. Expand the candidate's narrative into 2 to 3 paragraphs of recruiter-facing prose. Lead with verbs and outcomes. No filler. Use Tailwind classes from the allowlist. No em dashes."
    ),
  contact: z
    .string()
    .describe(
      "Full TypeScript source for app/components/contact.tsx. A Server Component. Default-exports a Contact function. Renders contact links provided in the input (email, github, linkedin, website). Skip any link not provided. Wrap in a section with id='contact'. Use Tailwind classes from the allowlist. No em dashes."
    ),
  page: z
    .string()
    .describe(
      "Full TypeScript source for app/page.tsx. A Server Component. Default-exports a Home function that imports Hero from './components/hero', Projects from './components/projects', About from './components/about', Contact from './components/contact', and renders them stacked in a single <main> element. No other imports. No em dashes."
    ),
  previewHtml: z
    .string()
    .describe(
      "A complete <html> document representing how the portfolio will look. Inline a <script src='https://cdn.tailwindcss.com'></script> for utility classes. Inline a <style> block defining the same CSS variables as the project's globals.css under :root (--color-background, --color-foreground, --color-muted, --color-accent, --color-accent-foreground, --color-card, --color-border) and load Instrument Sans + Instrument Serif from Google Fonts. The body should visually render the same content as the React components stacked: hero, projects, about, contact. No em dashes anywhere."
    ),
  meta: z.object({
    name: z
      .string()
      .describe(
        "Project slug, kebab-case, derived from the candidate's name, lowercase, only [a-z0-9-]. Example: 'maya-chen-portfolio'."
      ),
    title: z
      .string()
      .describe("Browser tab title for the portfolio."),
  }),
});

const ALLOWED_IMPORT_RE =
  /^\s*import\s+.+\s+from\s+["'](react|\.\/components\/(hero|projects|about|contact))["'];?\s*$/;

function validateTsx(path: string, content: string): string | null {
  if (!content.includes("export default")) {
    return `${path} is missing a default export`;
  }
  if (content.includes('"use client"') || content.includes("'use client'")) {
    return `${path} must be a Server Component (remove 'use client')`;
  }
  if (content.includes("—") || content.includes("–")) {
    return `${path} contains an em or en dash; replace with comma or semicolon`;
  }
  // Verify imports are within allowlist.
  const lines = content.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("import")) continue;
    if (!ALLOWED_IMPORT_RE.test(line)) {
      // Allow type-only imports from react for TS edge cases.
      if (/^import\s+type\s+.+from\s+["']react["'];?\s*$/.test(trimmed)) {
        continue;
      }
      return `${path} has a disallowed import: ${trimmed}`;
    }
  }
  return null;
}

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
          text: "Drafting your hero, projects, about, and contact sections.",
        });

        const result = await generateObject({
          model: anthropic(MODEL),
          schema: OutputSchema,
          system: `You are ScoutFolio's portfolio generation agent. You write small, polished, Server-only Next.js components that ship as a starter site. You use only the Tailwind class allowlist provided. You never use 'use client'. You never use em dashes (use commas, semicolons, or separate sentences). You never invent URLs the user did not provide. Lead with verbs and outcomes; avoid filler ("passionate about", "team player").`,
          prompt: `Generate a single-page portfolio for this candidate.

Name: ${candidateName}
Target role: ${targetRole}
Headline (from discovery): ${parsed.inventory.headline}
Narrative (free text the candidate wrote about themselves):
${narrative || "(none provided)"}

Contact links:
${Object.entries(contact)
  .filter(([, v]) => Boolean(v))
  .map(([k, v]) => `- ${k}: ${v}`)
  .join("\n") || "(none provided)"}

Reviewed inventory (FEATURE = top of page, INCLUDE = secondary slot, items where action is skip have been filtered out already):

${inventoryContext}

Produce all six string fields and the meta object. The previewHtml should visually render the same content as the React components, ready to display in an iframe. Component files use the same color tokens (bg-background, text-foreground, etc.) so they look identical to the preview when shipped.`,
        });

        const generated = result.object;

        send(controller, {
          type: "status",
          text: "Validating generated components.",
        });

        const tsxFiles: Array<{ path: string; content: string }> = [
          { path: "app/components/hero.tsx", content: generated.hero },
          { path: "app/components/projects.tsx", content: generated.projects },
          { path: "app/components/about.tsx", content: generated.about },
          { path: "app/components/contact.tsx", content: generated.contact },
          { path: "app/page.tsx", content: generated.page },
        ];

        for (const f of tsxFiles) {
          const err = validateTsx(f.path, f.content);
          if (err) {
            send(controller, {
              type: "error",
              message: err,
            });
            controller.close();
            return;
          }
          send(controller, { type: "file_complete", path: f.path });
        }

        const slug = generated.meta.name
          .toLowerCase()
          .replace(/[^a-z0-9-]/g, "-")
          .replace(/-+/g, "-")
          .replace(/^-|-$/g, "")
          .slice(0, 60) || "portfolio";

        const scaffold: ScaffoldFile[] = buildScaffold({
          projectName: slug,
          title: generated.meta.title,
        });

        const allFiles = [...scaffold, ...tsxFiles];

        await recordUsage("generate", session.user!.email!);

        send(controller, {
          type: "complete",
          data: {
            files: allFiles,
            previewHtml: generated.previewHtml,
            meta: {
              name: slug,
              title: generated.meta.title,
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
